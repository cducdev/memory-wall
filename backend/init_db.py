"""
Script để khởi tạo database tables
Chạy: python init_db.py
"""
from main import Base, engine
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    print("Đang tạo database tables...")
    Base.metadata.create_all(bind=engine)
    print("Đã tạo database tables thành công!")


