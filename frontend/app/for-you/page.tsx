"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { publicAPI } from "@/lib/api";
import Link from "next/link";

export default function ForYouPage() {
	const [formData, setFormData] = useState({
		sender_name: "",
		content: "",
		emoji: "💖",
		is_anonymous: false,
		wants_memory: false,
		verification_name: "",
		verification_facebook: "",
	});
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// Validation
		if (!formData.content.trim()) {
			setError("Vui lòng nhập nội dung");
			setLoading(false);
			return;
		}

		if (formData.wants_memory) {
			if (
				!formData.verification_name.trim() ||
				!formData.verification_facebook.trim()
			) {
				setError("Vui lòng điền đầy đủ thông tin xác nhận danh tính");
				setLoading(false);
				return;
			}
		}

		try {
			const submitFormData = new FormData();
			if (!formData.is_anonymous && formData.sender_name) {
				submitFormData.append("sender_name", formData.sender_name);
			}
			submitFormData.append("content", formData.content);
			submitFormData.append("emoji", formData.emoji);
			submitFormData.append(
				"is_anonymous",
				formData.is_anonymous.toString()
			);
			submitFormData.append(
				"wants_memory",
				formData.wants_memory.toString()
			);

			if (formData.wants_memory) {
				submitFormData.append(
					"verification_name",
					formData.verification_name
				);
				submitFormData.append(
					"verification_facebook",
					formData.verification_facebook
				);
				submitFormData.append("verification_email", "");
				submitFormData.append("verification_memory", "");
			}

			if (image) {
				submitFormData.append("image", image);
			}

			await publicAPI.sendMessage(submitFormData);
			setSuccess(true);
		} catch (err: any) {
			setError(
				err.response?.data?.detail || "Có lỗi xảy ra, vui lòng thử lại"
			);
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="card max-w-md text-center"
				>
					<div className="text-6xl mb-4">✅</div>
					<h2 className="text-2xl font-bold mb-2 text-pink-600">
						Gửi thành công!
					</h2>
					<p className="text-gray-600 mb-6">Cảm ơn nhee</p>
					<Link href="/" className="btn-primary inline-block">
						Về trang chủ
					</Link>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-12 px-4">
			<div className="max-w-2xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="card"
				>
					<h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
						Cho tui biết kỉ niệm nào khiến bạn thích thú nhất đi =))
					</h1>

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
								{error}
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tên của bạn (tùy chọn)
							</label>
							<input
								type="text"
								value={formData.sender_name}
								onChange={(e) =>
									setFormData({
										...formData,
										sender_name: e.target.value,
									})
								}
								className="input-field"
								disabled={formData.is_anonymous}
								placeholder="Nhập tên của bạn"
							/>
						</div>

						<div>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={formData.is_anonymous}
									onChange={(e) =>
										setFormData({
											...formData,
											is_anonymous: e.target.checked,
										})
									}
									className="w-5 h-5"
								/>
								<span className="text-sm font-medium text-gray-700">
									Gửi ẩn danh
								</span>
							</label>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Nội dung <span className="text-red-500">*</span>
							</label>
							<textarea
								value={formData.content}
								onChange={(e) =>
									setFormData({
										...formData,
										content: e.target.value,
									})
								}
								className="input-field min-h-[120px]"
								placeholder="Viết lời nhắn của bạn..."
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Emoji
							</label>
							<input
								type="text"
								value={formData.emoji}
								onChange={(e) =>
									setFormData({
										...formData,
										emoji: e.target.value,
									})
								}
								className="input-field"
								placeholder="💖"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Ảnh (tùy chọn)
							</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="input-field"
							/>
							{imagePreview && (
								<div className="mt-4">
									<img
										src={imagePreview}
										alt="Preview"
										className="max-w-xs rounded-lg shadow-md"
									/>
								</div>
							)}
						</div>

						<div>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={formData.wants_memory}
									onChange={(e) =>
										setFormData({
											...formData,
											wants_memory: e.target.checked,
										})
									}
									className="w-5 h-5"
								/>
								<span className="text-sm font-medium text-gray-700">
									Muốn nhận recap memory của Cao Đức?
								</span>
							</label>
						</div>

						{formData.wants_memory && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200"
							>
								<h3 className="font-semibold text-purple-800">
									Xác nhận danh tính
								</h3>

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
									<p className="text-sm text-blue-800">
										<strong>Lưu ý:</strong> Tui sẽ gửi cho
										bạn link recap memory của mình qua
										Facebook của bạn nhé!
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Tên{" "}
										<span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={formData.verification_name}
										onChange={(e) =>
											setFormData({
												...formData,
												verification_name:
													e.target.value,
											})
										}
										className="input-field"
										placeholder="Tên đầy đủ hoặc tên thường gọi"
										required={formData.wants_memory}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Facebook{" "}
										<span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={formData.verification_facebook}
										onChange={(e) =>
											setFormData({
												...formData,
												verification_facebook:
													e.target.value,
											})
										}
										className="input-field"
										placeholder="Link Facebook profile hoặc username"
										required={formData.wants_memory}
									/>
								</div>
							</motion.div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Đang gửi..." : "Gửi lời nhắn"}
						</button>
					</form>
				</motion.div>
			</div>
		</div>
	);
}
