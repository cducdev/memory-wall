"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="text-center"
			>
				<h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
					Memory Wall
				</h1>
				<p className="text-xl text-gray-600 mb-8">
					Cho tui biết bạn thích kỉ niệm nào nhất nhe
				</p>
				<div className="flex gap-4 justify-center">
					<Link href="/for-you" className="btn-primary">
						Bắt đầu
					</Link>
				</div>
			</motion.div>
		</div>
	);
}
