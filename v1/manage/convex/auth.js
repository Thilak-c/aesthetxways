import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper functions
function nowIso() {
	return new Date().toISOString();
}

function calculateSessionExpiry() {
	const now = new Date();
	now.setDate(now.getDate() + 30); // 30 days from now
	return now.toISOString();
}

function generateSessionToken() {
	// Generate a random UUID-like token
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Simple hash function (for development - in production use bcrypt via actions)
async function simpleHash(password) {
	// This is a placeholder - you should use bcrypt in production
	// For now, we'll just store the password as-is (NOT SECURE)
	return password;
}

async function simpleCompare(password, hash) {
	// This is a placeholder - you should use bcrypt in production
	return password === hash;
}

// Mutation: signup
export const signup = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.optional(v.string()),
	},
	handler: async (ctx, { email, password, name }) => {
		try {
			// Validate password length
			if (password.length < 8) {
				throw new Error("Password must be at least 8 characters long");
			}

			const normalizedEmail = email.toLowerCase().trim();

			// Check if user already exists
			const existing = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
				.filter(q => q.eq(q.field("isDeleted"), undefined))
				.unique();

			if (existing) {
				throw new Error("Email already registered");
			}

			// Hash password (using simple hash for now)
			const passwordHash = await simpleHash(password);

			// Create user
			const userId = await ctx.db.insert("users", {
				email: normalizedEmail,
				passwordHash,
				name: name || "",
				createdAt: nowIso(),
				updatedAt: nowIso(),
				role: "user",
				isActive: true,
				onboardingStep: 1,
				onboardingCompleted: false,
				interests: [],
			});

			// Generate session
			const sessionToken = generateSessionToken();
			const expiresAt = calculateSessionExpiry();

			// Create session
			await ctx.db.insert("sessions", {
				userId,
				sessionToken,
				expiresAt,
				createdAt: nowIso(),
			});

			return {
				success: true,
				sessionToken,
				userId,
			};
		} catch (error) {
			throw new Error(error.message || "Signup failed");
		}
	},
});

// Mutation: sign in
export const signIn = mutation({
	args: {
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, { email, password }) => {
		try {
			const normalizedEmail = email.toLowerCase().trim();

			// Get user by email
			const user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
				.unique();

			if (!user) {
				throw new Error("Invalid email or password");
			}

			// Check if user is deleted
			if (user.isDeleted) {
				return {
					status: "account_deleted",
					deletionInfo: {
						deletedAt: user.deletedAt,
						deletedBy: user.deletedBy,
						reason: "Account deleted by administrator",
						email: user.email,
						name: user.name || "User",
					},
				};
			}

			// Verify password (using simple compare for now)
			const passwordMatch = await simpleCompare(password, user.passwordHash);
			if (!passwordMatch) {
				throw new Error("Invalid email or password");
			}

			// Auto-reactivate deactivated users
			if (user.isActive === false) {
				await ctx.db.patch(user._id, {
					isActive: true,
					updatedAt: nowIso(),
				});
			}

			// Generate session
			const sessionToken = generateSessionToken();
			const expiresAt = calculateSessionExpiry();

			// Create session
			await ctx.db.insert("sessions", {
				userId: user._id,
				sessionToken,
				expiresAt,
				createdAt: nowIso(),
			});

			return {
				status: "success",
				sessionToken,
				userId: user._id,
			};
		} catch (error) {
			throw new Error(error.message || "Sign in failed");
		}
	},
});

// Mutation: admin sign in
export const adminSignIn = mutation({
	args: {
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, { email, password }) => {
		try {
			const normalizedEmail = email.toLowerCase().trim();

			// Get user by email
			const user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
				.unique();

			if (!user) {
				throw new Error("Invalid credentials");
			}

			// Check if user is deleted
			if (user.isDeleted) {
				return {
					status: "account_deleted",
					deletionInfo: {
						deletedAt: user.deletedAt,
						deletedBy: user.deletedBy,
						reason: "Account deleted by administrator",
						email: user.email,
						name: user.name || "Admin",
					},
				};
			}

			// Check admin role
			if (user.role !== "admin" && user.role !== "super_admin") {
				throw new Error("Access denied. Admin privileges required.");
			}

			// Check if admin account is active
			if (user.isActive === false) {
				throw new Error("Admin account is inactive. Contact super admin.");
			}

			// Verify password
			const passwordMatch = await simpleCompare(password, user.passwordHash);
			if (!passwordMatch) {
				throw new Error("Invalid credentials");
			}

			// Generate session
			const sessionToken = generateSessionToken();
			const expiresAt = calculateSessionExpiry();

			// Create session
			await ctx.db.insert("sessions", {
				userId: user._id,
				sessionToken,
				expiresAt,
				createdAt: nowIso(),
			});

			return {
				status: "success",
				sessionToken,
				userId: user._id,
				role: user.role,
				name: user.name || "",
				email: user.email,
			};
		} catch (error) {
			throw new Error(error.message || "Admin sign in failed");
		}
	},
});

// Mutation: create super admin
export const createSuperAdmin = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
	},
	handler: async (ctx, { email, password, name }) => {
		try {
			// Check if super admin already exists
			const existingSuperAdmin = await ctx.db
				.query("users")
				.withIndex("by_role", (q) => q.eq("role", "super_admin"))
				.first();

			if (existingSuperAdmin) {
				throw new Error("Super admin already exists. Contact existing super admin.");
			}

			// Validate password
			if (password.length < 8) {
				throw new Error("Password must be at least 8 characters long");
			}

			const normalizedEmail = email.toLowerCase().trim();

			// Hash password
			const passwordHash = await simpleHash(password);

			// Check for existing active user
			const existing = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
				.filter(q => q.eq(q.field("isDeleted"), undefined))
				.unique();

			if (existing) {
				throw new Error("Email already registered");
			}

			// Create new super admin
			const userId = await ctx.db.insert("users", {
				email: normalizedEmail,
				passwordHash,
				name,
				createdAt: nowIso(),
				updatedAt: nowIso(),
				role: "super_admin",
				isActive: true,
				onboardingStep: 4,
				onboardingCompleted: true,
				interests: [],
			});

			// Generate session
			const sessionToken = generateSessionToken();
			const expiresAt = calculateSessionExpiry();

			// Create session
			await ctx.db.insert("sessions", {
				userId,
				sessionToken,
				expiresAt,
				createdAt: nowIso(),
			});

			return {
				success: true,
				sessionToken,
				userId,
				role: "super_admin",
			};
		} catch (error) {
			throw new Error(error.message || "Failed to create super admin");
		}
	},
});

// Mutation: sign out
export const signOut = mutation({
	args: { sessionToken: v.string() },
	handler: async (ctx, { sessionToken }) => {
		const session = await ctx.db
			.query("sessions")
			.withIndex("by_token", (q) => q.eq("sessionToken", sessionToken))
			.unique();
		
		if (session) {
			await ctx.db.delete(session._id);
		}
		
		return { success: true };
	},
});


// Generate 6-digit OTP
function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mutation: Request password reset OTP
export const requestPasswordResetOTP = mutation({
	args: {
		email: v.string(),
	},
	handler: async (ctx, { email }) => {
		const normalizedEmail = email.toLowerCase().trim();

		// Check if user exists
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.unique();

		if (!user) {
			// Don't reveal if email exists or not for security
			return { success: true, message: "If the email exists, an OTP has been sent." };
		}

		if (user.isDeleted) {
			return { success: false, message: "This account has been deleted." };
		}

		// Generate OTP
		const otp = generateOTP();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

		// Delete any existing OTP for this user
		const existingOTPs = await ctx.db
			.query("passwordResetOTPs")
			.filter((q) => q.eq(q.field("email"), normalizedEmail))
			.collect();

		for (const existingOTP of existingOTPs) {
			await ctx.db.delete(existingOTP._id);
		}

		// Store OTP in database
		await ctx.db.insert("passwordResetOTPs", {
			email: normalizedEmail,
			otp,
			expiresAt,
			createdAt: nowIso(),
			used: false,
		});

		return {
			success: true,
			message: "OTP generated successfully",
			otp, // Return OTP to send via email API
			email: normalizedEmail,
			userName: user.name || "User",
		};
	},
});

// Mutation: Verify OTP
export const verifyPasswordResetOTP = mutation({
	args: {
		email: v.string(),
		otp: v.string(),
	},
	handler: async (ctx, { email, otp }) => {
		const normalizedEmail = email.toLowerCase().trim();

		// Find OTP record
		const otpRecord = await ctx.db
			.query("passwordResetOTPs")
			.filter((q) => 
				q.and(
					q.eq(q.field("email"), normalizedEmail),
					q.eq(q.field("otp"), otp),
					q.eq(q.field("used"), false)
				)
			)
			.first();

		if (!otpRecord) {
			return { success: false, message: "Invalid OTP. Please try again." };
		}

		// Check if OTP is expired
		if (new Date(otpRecord.expiresAt) < new Date()) {
			await ctx.db.delete(otpRecord._id);
			return { success: false, message: "OTP has expired. Please request a new one." };
		}

		// Mark OTP as verified (but not used yet - will be used when password is reset)
		await ctx.db.patch(otpRecord._id, { verified: true });

		return { success: true, message: "OTP verified successfully" };
	},
});

// Mutation: Reset password with OTP
export const resetPasswordWithOTP = mutation({
	args: {
		email: v.string(),
		otp: v.string(),
		newPassword: v.string(),
	},
	handler: async (ctx, { email, otp, newPassword }) => {
		const normalizedEmail = email.toLowerCase().trim();

		// Validate password
		if (newPassword.length < 8) {
			return { success: false, message: "Password must be at least 8 characters long" };
		}

		// Find verified OTP record
		const otpRecord = await ctx.db
			.query("passwordResetOTPs")
			.filter((q) => 
				q.and(
					q.eq(q.field("email"), normalizedEmail),
					q.eq(q.field("otp"), otp),
					q.eq(q.field("used"), false)
				)
			)
			.first();

		if (!otpRecord) {
			return { success: false, message: "Invalid or expired OTP. Please request a new one." };
		}

		// Check if OTP is expired
		if (new Date(otpRecord.expiresAt) < new Date()) {
			await ctx.db.delete(otpRecord._id);
			return { success: false, message: "OTP has expired. Please request a new one." };
		}

		// Find user
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.unique();

		if (!user) {
			return { success: false, message: "User not found" };
		}

		// Update password
		const passwordHash = await simpleHash(newPassword);
		await ctx.db.patch(user._id, {
			passwordHash,
			updatedAt: nowIso(),
		});

		// Mark OTP as used
		await ctx.db.patch(otpRecord._id, { used: true });

		// Delete all sessions for this user (force re-login)
		const sessions = await ctx.db
			.query("sessions")
			.filter((q) => q.eq(q.field("userId"), user._id))
			.collect();

		for (const session of sessions) {
			await ctx.db.delete(session._id);
		}

		return { success: true, message: "Password reset successfully. Please login with your new password." };
	},
});




	// Mutation: Create session for email after OTP verification (used by email-OTP flow)
	export const createSessionForEmail = mutation({
		args: {
			email: v.string(),
		},
		handler: async (ctx, { email }) => {
			try {
				const normalizedEmail = email.toLowerCase().trim();

				// Find user by email (ignore deleted)
				let user = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
					.first();

				if (!user) {
					// Create new user for this email
					const userId = await ctx.db.insert("users", {
						email: normalizedEmail,
						phoneNumber: "",
						name: "",
						createdAt: nowIso(),
						updatedAt: nowIso(),
						role: "user",
						isActive: true,
						onboardingStep: 4,
						onboardingCompleted: true,
						interests: [],
					});
					user = await ctx.db.get(userId);
				} else {
					// Update last login
					await ctx.db.patch(user._id, {
						updatedAt: nowIso(),
						isActive: true,
					});
				}

				// Generate session
				const sessionToken = generateSessionToken();
				const expiresAt = calculateSessionExpiry();

				// Create session
				await ctx.db.insert("sessions", {
					userId: user._id,
					sessionToken,
					expiresAt,
					createdAt: nowIso(),
				});

				return {
					success: true,
					sessionToken,
					userId: user._id,
					isNewUser: !user.name,
				};
			} catch (error) {
				console.error("createSessionForEmail error:", error);
				return { success: false, message: "Failed to create session for email" };
			}
		},
	});

export const generateEmailOtp = mutation({
	args: { email: v.string(), otp: v.string(), expiresAt: v.string() },
	handler: async (ctx, { email, otp, expiresAt }) => {
		const normalizedEmail = email.toLowerCase().trim();
		
		// Delete any existing OTP for this email
		const existingOTPs = await ctx.db
			.query("passwordResetOTPs")
			.filter((q) => q.eq(q.field("email"), normalizedEmail))
			.collect();

		for (const existingOTP of existingOTPs) {
			await ctx.db.delete(existingOTP._id);
		}

		// Store OTP in database
		await ctx.db.insert("passwordResetOTPs", {
			email: normalizedEmail,
			otp,
			expiresAt,
			createdAt: nowIso(),
			used: false,
		});
		
		return { success: true };
	}
});

export const verifyEmailOtpAndLogin = mutation({
	args: { email: v.string(), otp: v.string() },
	handler: async (ctx, { email, otp }) => {
		const normalizedEmail = email.toLowerCase().trim();
		const otpTrimmed = otp.trim();

		// Find the OTP record
		const otpRecord = await ctx.db
			.query("passwordResetOTPs")
			.filter((q) => 
				q.and(
					q.eq(q.field("email"), normalizedEmail),
					q.eq(q.field("otp"), otpTrimmed),
					q.eq(q.field("used"), false)
				)
			)
			.first();

		if (!otpRecord) {
			return { success: false, message: "Invalid OTP code. Please try again." };
		}

		// Check expiration
		if (new Date() > new Date(otpRecord.expiresAt)) {
			await ctx.db.delete(otpRecord._id); // Clean up expired OTP
			return { success: false, message: "OTP has expired. Please request a new one." };
		}

		// OTP verified! Delete OTP record
		await ctx.db.delete(otpRecord._id);

		// Find or create User
		let user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.filter(q => q.eq(q.field("isDeleted"), undefined))
			.unique();

		if (!user) {
			const emailPrefix = normalizedEmail.split('@')[0];
			const name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
			const userId = await ctx.db.insert("users", {
				name: name,
				email: normalizedEmail,
				createdAt: nowIso(),
				updatedAt: nowIso(),
				role: "user",
				isActive: true,
				onboardingStep: 4,
				onboardingCompleted: true,
				interests: [],
			});
			user = await ctx.db.get(userId);
		} else {
			// Update last login
			await ctx.db.patch(user._id, {
				updatedAt: nowIso(),
				isActive: true,
			});
		}

		return {
			success: true,
			message: "OTP verified successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role || "user",
			},
		};
	}
});



