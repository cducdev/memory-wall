from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# Try to import cloudinary, make it optional
try:
    import cloudinary
    import cloudinary.uploader
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False
    print("Warning: cloudinary not installed. Image upload will be disabled.")

app = FastAPI(title="Memory Wall API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên giới hạn domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Cloudinary setup (optional)
if CLOUDINARY_AVAILABLE:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
        )
    else:
        CLOUDINARY_AVAILABLE = False
        print("Warning: Cloudinary credentials not set. Image upload will be disabled.")

# Database Models
class Receiver(Base):
    __tablename__ = "receivers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    secret_token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    memories = relationship("AdminMemory", back_populates="receiver")

class AdminMemory(Base):
    __tablename__ = "admin_memories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("receivers.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    emoji = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    receiver = relationship("Receiver", back_populates="memories")

class MessageToAdmin(Base):
    __tablename__ = "messages_to_admin"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_name = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    emoji = Column(String, nullable=True)
    image_url = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    wants_memory = Column(Boolean, default=False)
    verification_name = Column(String, nullable=True)
    verification_facebook = Column(String, nullable=True)
    verification_email = Column(String, nullable=True)
    verification_memory = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("receivers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    receiver = relationship("Receiver", foreign_keys=[receiver_id])

# Pydantic Models
class LoginRequest(BaseModel):
    password: str

class ReceiverCreate(BaseModel):
    name: str

class ReceiverResponse(BaseModel):
    id: str
    name: str
    secret_token: str
    link: str
    
    class Config:
        from_attributes = True

class MemoryCreate(BaseModel):
    receiver_id: str
    content: str
    emoji: Optional[str] = None
    image_url: Optional[str] = None

class MemoryResponse(BaseModel):
    content: str
    emoji: Optional[str] = None
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class PublicMemoryResponse(BaseModel):
    receiver_name: str
    memories: List[MemoryResponse]

class MessageCreate(BaseModel):
    sender_name: Optional[str] = None
    content: str
    emoji: Optional[str] = None
    is_anonymous: bool = False
    wants_memory: bool = False
    verification_name: Optional[str] = None
    verification_facebook: Optional[str] = None
    verification_email: Optional[str] = None
    verification_memory: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_name: Optional[str]
    content: str
    emoji: Optional[str]
    image_url: Optional[str]
    is_anonymous: bool
    wants_memory: bool
    verification_name: Optional[str]
    verification_facebook: Optional[str]
    verification_email: Optional[str]
    verification_memory: Optional[str]
    is_verified: bool
    receiver_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class VerifyMessageRequest(BaseModel):
    name: str

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Simple session storage (trong production nên dùng Redis hoặc database)
admin_sessions = set()

def verify_admin(password: str = None):
    admin_password = os.getenv("ADMIN_PASSWORD")
    if password != admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai mật khẩu"
        )
    return True

# API Routes

@app.post("/api/admin/login")
async def admin_login(request: LoginRequest):
    verify_admin(request.password)
    session_id = str(uuid.uuid4())
    admin_sessions.add(session_id)
    return {"success": True, "session_id": session_id}

@app.post("/api/admin/receiver")
async def create_receiver(receiver: ReceiverCreate, db: Session = Depends(get_db)):
    secret_token = str(uuid.uuid4())
    new_receiver = Receiver(
        name=receiver.name,
        secret_token=secret_token
    )
    db.add(new_receiver)
    db.commit()
    db.refresh(new_receiver)
    
    return ReceiverResponse(
        id=str(new_receiver.id),
        name=new_receiver.name,
        secret_token=new_receiver.secret_token,
        link=f"/to/{new_receiver.secret_token}"
    )

@app.get("/api/admin/receivers")
async def get_receivers(db: Session = Depends(get_db)):
    receivers = db.query(Receiver).order_by(Receiver.created_at.desc()).all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "secret_token": r.secret_token,
            "created_at": r.created_at.isoformat()
        }
        for r in receivers
    ]

@app.post("/api/admin/memory")
async def create_memory(memory: MemoryCreate, db: Session = Depends(get_db)):
    receiver = db.query(Receiver).filter(Receiver.id == memory.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver không tồn tại")
    
    new_memory = AdminMemory(
        receiver_id=memory.receiver_id,
        content=memory.content,
        emoji=memory.emoji,
        image_url=memory.image_url
    )
    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)
    
    return {"success": True, "id": str(new_memory.id)}

@app.get("/api/public/to/{token}")
async def get_public_memory(token: str, db: Session = Depends(get_db)):
    receiver = db.query(Receiver).filter(Receiver.secret_token == token).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Không tìm thấy memory")
    
    memories = db.query(AdminMemory).filter(AdminMemory.receiver_id == receiver.id).all()
    
    return PublicMemoryResponse(
        receiver_name=receiver.name,
        memories=[
            MemoryResponse(
                content=m.content,
                emoji=m.emoji,
                image_url=m.image_url
            )
            for m in memories
        ]
    )

@app.post("/api/message")
async def create_message(
    sender_name: Optional[str] = Form(None),
    content: str = Form(...),
    emoji: Optional[str] = Form(None),
    is_anonymous: bool = Form(False),
    wants_memory: bool = Form(False),
    verification_name: Optional[str] = Form(None),
    verification_facebook: Optional[str] = Form(None),
    verification_email: Optional[str] = Form(None),
    verification_memory: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Validation
    if not content.strip():
        raise HTTPException(status_code=400, detail="Nội dung không được để trống")
    
    if wants_memory:
        if not verification_name or not verification_name.strip():
            raise HTTPException(status_code=400, detail="Tên xác nhận là bắt buộc")
        if not verification_facebook or not verification_facebook.strip():
            raise HTTPException(status_code=400, detail="Facebook là bắt buộc")
    
    # Upload image if provided
    image_url = None
    if image:
        # Validate image
        if image.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh (jpg, png, gif, webp)")
        
        # Check file size (5MB)
        file_content = await image.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Kích thước ảnh tối đa 5MB")
        
        # Upload to Cloudinary (if available)
        if CLOUDINARY_AVAILABLE:
            try:
                upload_result = cloudinary.uploader.upload(
                    file_content,
                    folder="memory-wall",
                    resource_type="image"
                )
                image_url = upload_result.get("secure_url")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh: {str(e)}")
        else:
            raise HTTPException(
                status_code=503, 
                detail="Tính năng upload ảnh chưa được cấu hình. Vui lòng cấu hình Cloudinary hoặc liên hệ admin."
            )
    
    new_message = MessageToAdmin(
        sender_name=sender_name if not is_anonymous else None,
        content=content,
        emoji=emoji,
        image_url=image_url,
        is_anonymous=is_anonymous,
        wants_memory=wants_memory,
        verification_name=verification_name if wants_memory else None,
        verification_facebook=verification_facebook if wants_memory else None,
        verification_email=verification_email if wants_memory else None,
        verification_memory=verification_memory if wants_memory else None
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return {"message": "Gửi thành công!", "id": str(new_message.id)}

@app.get("/api/admin/messages")
async def get_messages(db: Session = Depends(get_db)):
    messages = db.query(MessageToAdmin).order_by(MessageToAdmin.created_at.desc()).all()
    return [
        MessageResponse(
            id=str(m.id),
            sender_name=m.sender_name,
            content=m.content,
            emoji=m.emoji,
            image_url=m.image_url,
            is_anonymous=m.is_anonymous,
            wants_memory=m.wants_memory,
            verification_name=m.verification_name,
            verification_facebook=m.verification_facebook,
            verification_email=m.verification_email,
            verification_memory=m.verification_memory,
            is_verified=m.is_verified,
            receiver_id=str(m.receiver_id) if m.receiver_id else None,
            created_at=m.created_at
        )
        for m in messages
    ]

@app.post("/api/admin/verify-message/{message_id}")
async def verify_message(message_id: str, request: VerifyMessageRequest, db: Session = Depends(get_db)):
    message = db.query(MessageToAdmin).filter(MessageToAdmin.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message không tồn tại")
    
    if message.is_verified:
        raise HTTPException(status_code=400, detail="Message đã được xác nhận")
    
    # Create receiver
    secret_token = str(uuid.uuid4())
    new_receiver = Receiver(
        name=request.name,
        secret_token=secret_token
    )
    db.add(new_receiver)
    db.flush()
    
    # Update message
    message.is_verified = True
    message.receiver_id = new_receiver.id
    
    db.commit()
    db.refresh(new_receiver)
    
    return {
        "message": "Đã xác nhận và tạo receiver",
        "receiver_id": str(new_receiver.id),
        "secret_token": new_receiver.secret_token,
        "link": f"/to/{new_receiver.secret_token}"
    }

@app.get("/")
async def root():
    return {"message": "Memory Wall API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

