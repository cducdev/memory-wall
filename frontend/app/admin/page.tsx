"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminAPI } from "@/lib/api";

interface Receiver {
	id: string;
	name: string;
	secret_token?: string;
	created_at: string;
}

interface Message {
	id: string;
	sender_name: string | null;
	content: string;
	emoji: string | null;
	image_url: string | null;
	is_anonymous: boolean;
	wants_memory: boolean;
	verification_name: string | null;
	verification_facebook: string | null;
	verification_email: string | null;
	verification_memory: string | null;
	is_verified: boolean;
	receiver_id: string | null;
	created_at: string;
}

export default function AdminPage() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [password, setPassword] = useState("");
	const [activeTab, setActiveTab] = useState<"receivers" | "inbox">(
		"receivers"
	);
	const [receivers, setReceivers] = useState<Receiver[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [filter, setFilter] = useState<"all" | "unverified" | "verified">(
		"all"
	);
	const [newReceiverName, setNewReceiverName] = useState("");
	const [newMemory, setNewMemory] = useState({
		receiver_id: "",
		content: "",
		emoji: "",
		image_url: "",
	});
	const [verifyingMessage, setVerifyingMessage] = useState<Message | null>(
		null
	);
	const [verifyName, setVerifyName] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Check if already authenticated (simple check)
		const sessionId = localStorage.getItem("admin_session");
		if (sessionId) {
			setIsAuthenticated(true);
			loadData();
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			loadData();
		}
	}, [isAuthenticated, activeTab]);

	const loadData = async () => {
		try {
			if (activeTab === "receivers") {
				const data = await adminAPI.getReceivers();
				setReceivers(data);
			} else {
				const data = await adminAPI.getMessages();
				setMessages(data);
			}
		} catch (error) {
			console.error("Error loading data:", error);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const result = await adminAPI.login(password);
			if (result.success) {
				localStorage.setItem(
					"admin_session",
					result.session_id || "authenticated"
				);
				setIsAuthenticated(true);
			}
		} catch (error: any) {
			alert(error.response?.data?.detail || "Sai mật khẩu");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateReceiver = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newReceiverName.trim()) return;

		try {
			const result = await adminAPI.createReceiver(newReceiverName);
			alert(`Đã tạo receiver! Link: ${result.link}`);
			setNewReceiverName("");
			loadData();
		} catch (error: any) {
			alert(error.response?.data?.detail || "Có lỗi xảy ra");
		}
	};

	const handleCreateMemory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMemory.receiver_id || !newMemory.content.trim()) {
			alert("Vui lòng điền đầy đủ thông tin");
			return;
		}

		try {
			await adminAPI.createMemory(newMemory);
			alert("Đã tạo memory!");
			setNewMemory({
				receiver_id: "",
				content: "",
				emoji: "",
				image_url: "",
			});
			loadData();
		} catch (error: any) {
			alert(error.response?.data?.detail || "Có lỗi xảy ra");
		}
	};

	const handleVerifyMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!verifyingMessage || !verifyName.trim()) return;

		try {
			const result = await adminAPI.verifyMessage(
				verifyingMessage.id,
				verifyName
			);
			alert(`Đã xác nhận! Link: ${result.link}`);
			setVerifyingMessage(null);
			setVerifyName("");
			loadData();
		} catch (error: any) {
			alert(error.response?.data?.detail || "Có lỗi xảy ra");
		}
	};

	const copyLink = (token: string) => {
		const link = `${window.location.origin}/to/${token}`;
		navigator.clipboard.writeText(link);
		alert("Đã copy link!");
	};

	const filteredMessages = messages.filter((msg) => {
		if (filter === "unverified") return !msg.is_verified;
		if (filter === "verified") return msg.is_verified;
		return true;
	});

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="card max-w-md"
				>
					<h1 className="text-3xl font-bold mb-6 text-center">
						Đăng nhập - Cao Đức
					</h1>
					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Mật khẩu
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="input-field"
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="btn-primary w-full"
						>
							{loading ? "Đang đăng nhập..." : "Đăng nhập"}
						</button>
					</form>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-8 px-4">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
					Cao Đức Dashboard
				</h1>

				{/* Tabs */}
				<div className="flex gap-4 mb-6 border-b-2 border-gray-200">
					<button
						onClick={() => setActiveTab("receivers")}
						className={`px-6 py-3 font-semibold ${
							activeTab === "receivers"
								? "text-pink-600 border-b-2 border-pink-600"
								: "text-gray-600"
						}`}
					>
						Quản lý người nhận
					</button>
					<button
						onClick={() => setActiveTab("inbox")}
						className={`px-6 py-3 font-semibold ${
							activeTab === "inbox"
								? "text-pink-600 border-b-2 border-pink-600"
								: "text-gray-600"
						}`}
					>
						Inbox
					</button>
				</div>

				{/* Receivers Tab */}
				{activeTab === "receivers" && (
					<div className="space-y-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="card"
						>
							<h2 className="text-2xl font-bold mb-4">
								Tạo người nhận mới
							</h2>
							<form
								onSubmit={handleCreateReceiver}
								className="flex gap-4"
							>
								<input
									type="text"
									value={newReceiverName}
									onChange={(e) =>
										setNewReceiverName(e.target.value)
									}
									className="input-field flex-1"
									placeholder="Tên người nhận"
									required
								/>
								<button type="submit" className="btn-primary">
									Tạo
								</button>
							</form>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="card"
						>
							<h2 className="text-2xl font-bold mb-4">
								Danh sách người nhận
							</h2>
							<div className="space-y-4">
								{receivers.map((receiver) => (
									<div
										key={receiver.id}
										className="p-4 border-2 border-gray-200 rounded-lg flex justify-between items-center"
									>
										<div>
											<h3 className="font-semibold text-lg">
												{receiver.name}
											</h3>
											<p className="text-sm text-gray-500">
												{new Date(
													receiver.created_at
												).toLocaleString("vi-VN")}
											</p>
										</div>
										<button
											onClick={() => {
												const receiverWithToken =
													receivers.find(
														(r) =>
															r.id === receiver.id
													) as any;
												if (
													receiverWithToken?.secret_token
												) {
													copyLink(
														receiverWithToken.secret_token
													);
												}
											}}
											className="px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
										>
											Copy Link
										</button>
									</div>
								))}
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="card"
						>
							<h2 className="text-2xl font-bold mb-4">
								Tạo memory
							</h2>
							<form
								onSubmit={handleCreateMemory}
								className="space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Người nhận
									</label>
									<select
										value={newMemory.receiver_id}
										onChange={(e) =>
											setNewMemory({
												...newMemory,
												receiver_id: e.target.value,
											})
										}
										className="input-field"
										required
									>
										<option value="">
											Chọn người nhận
										</option>
										{receivers.map((r) => (
											<option key={r.id} value={r.id}>
												{r.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Nội dung
									</label>
									<textarea
										value={newMemory.content}
										onChange={(e) =>
											setNewMemory({
												...newMemory,
												content: e.target.value,
											})
										}
										className="input-field min-h-[120px]"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Emoji
									</label>
									<input
										type="text"
										value={newMemory.emoji}
										onChange={(e) =>
											setNewMemory({
												...newMemory,
												emoji: e.target.value,
											})
										}
										className="input-field"
										placeholder="💖"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Image URL (optional)
									</label>
									<input
										type="text"
										value={newMemory.image_url}
										onChange={(e) =>
											setNewMemory({
												...newMemory,
												image_url: e.target.value,
											})
										}
										className="input-field"
										placeholder="https://..."
									/>
								</div>
								<button
									type="submit"
									className="btn-primary w-full"
								>
									Tạo memory
								</button>
							</form>
						</motion.div>
					</div>
				)}

				{/* Inbox Tab */}
				{activeTab === "inbox" && (
					<div className="space-y-6">
						<div className="flex gap-4 mb-4">
							<button
								onClick={() => setFilter("all")}
								className={`px-4 py-2 rounded-lg ${
									filter === "all"
										? "bg-pink-500 text-white"
										: "bg-gray-200"
								}`}
							>
								Tất cả
							</button>
							<button
								onClick={() => setFilter("unverified")}
								className={`px-4 py-2 rounded-lg ${
									filter === "unverified"
										? "bg-pink-500 text-white"
										: "bg-gray-200"
								}`}
							>
								Chưa xác nhận
							</button>
							<button
								onClick={() => setFilter("verified")}
								className={`px-4 py-2 rounded-lg ${
									filter === "verified"
										? "bg-pink-500 text-white"
										: "bg-gray-200"
								}`}
							>
								Đã xác nhận
							</button>
						</div>

						<div className="space-y-6">
							{filteredMessages.map((message, index) => (
								<motion.div
									key={message.id}
									initial={{ opacity: 0, y: 50, scale: 0.9 }}
									animate={{
										opacity: 1,
										y: 0,
										scale: 1,
									}}
									transition={{
										delay: index * 0.15,
										duration: 0.5,
										type: "spring",
										stiffness: 100,
									}}
									whileHover={{
										scale: 1.02,
										y: -8,
										transition: { duration: 0.3 },
									}}
									className="card relative"
									style={{
										boxShadow:
											"0 15px 50px rgba(0, 0, 0, 0.12), 0 0 30px rgba(236, 72, 153, 0.08)",
									}}
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="font-semibold text-lg">
												{message.is_anonymous
													? "Ẩn danh"
													: message.sender_name ||
													  "Không tên"}
											</h3>
											<p className="text-sm text-gray-500">
												{new Date(
													message.created_at
												).toLocaleString("vi-VN")}
											</p>
										</div>
										{message.wants_memory && (
											<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
												Muốn nhận memory
											</span>
										)}
									</div>

									<motion.div
										animate={{
											y: [0, -10, 0],
										}}
										transition={{
											duration: 3 + index * 0.3,
											repeat: Infinity,
											ease: "easeInOut",
										}}
									>
										{message.emoji && (
											<motion.div
												className="text-4xl mb-2"
												animate={{
													rotate: [0, 3, -3, 0],
												}}
												transition={{
													duration: 2.5,
													repeat: Infinity,
													ease: "easeInOut",
												}}
											>
												{message.emoji}
											</motion.div>
										)}

										<p className="text-gray-800 mb-4 whitespace-pre-wrap font-serif">
											{message.content}
										</p>

										{message.image_url && (
											<motion.div
												whileHover={{ scale: 1.05 }}
												transition={{ duration: 0.3 }}
											>
												<img
													src={message.image_url}
													alt="Message"
													className="max-w-md rounded-lg mb-4 shadow-xl"
												/>
											</motion.div>
										)}
									</motion.div>

									{/* Decorative elements */}
									<div className="absolute -top-1 -right-1 w-16 h-16 bg-pink-200 rounded-full opacity-15 blur-xl"></div>
									<div className="absolute -bottom-1 -left-1 w-20 h-20 bg-purple-200 rounded-full opacity-15 blur-xl"></div>

									{message.wants_memory &&
										!message.is_verified && (
											<div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
												<h4 className="font-semibold text-purple-800 mb-2">
													Thông tin xác nhận:
												</h4>
												<div className="space-y-2 text-sm">
													<p>
														<strong>Tên:</strong>{" "}
														{
															message.verification_name
														}
													</p>
													<p>
														<strong>
															Facebook:
														</strong>{" "}
														{message.verification_facebook && (
															<a
																href={
																	message.verification_facebook
																}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-600 hover:underline"
															>
																{
																	message.verification_facebook
																}
															</a>
														)}
													</p>
													<p>
														<strong>Email:</strong>{" "}
														{
															message.verification_email
														}
													</p>
													<p>
														<strong>
															Kỷ niệm:
														</strong>{" "}
														{
															message.verification_memory
														}
													</p>
												</div>
												<button
													onClick={() =>
														setVerifyingMessage(
															message
														)
													}
													className="mt-4 btn-primary"
												>
													Xác nhận & Tạo receiver
												</button>
											</div>
										)}

									{message.is_verified &&
										message.receiver_id && (
											<div className="mt-4 p-4 bg-green-50 rounded-lg">
												<p className="text-green-700 font-semibold mb-2">
													Đã xác nhận
												</p>
												<p className="text-sm text-gray-600 mb-2">
													Receiver ID:{" "}
													{message.receiver_id ||
														"N/A"}
												</p>
												<p className="text-xs text-gray-500">
													Vui lòng kiểm tra danh sách
													receivers để lấy link
												</p>
											</div>
										)}
								</motion.div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Verify Message Modal */}
			{verifyingMessage && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="card max-w-md"
					>
						<h2 className="text-2xl font-bold mb-4">
							Xác nhận và tạo receiver
						</h2>
						<form
							onSubmit={handleVerifyMessage}
							className="space-y-4"
						>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Tên cho receiver
								</label>
								<input
									type="text"
									value={verifyName}
									onChange={(e) =>
										setVerifyName(e.target.value)
									}
									className="input-field"
									placeholder={
										verifyingMessage.verification_name ||
										"Nhập tên"
									}
									required
								/>
							</div>
							<div className="flex gap-4">
								<button
									type="button"
									onClick={() => {
										setVerifyingMessage(null);
										setVerifyName("");
									}}
									className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
								>
									Hủy
								</button>
								<button
									type="submit"
									className="flex-1 btn-primary"
								>
									Xác nhận
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</div>
	);
}
