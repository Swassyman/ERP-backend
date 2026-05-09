export function getPasswordSetupHtml(setupUrl: string) {
	return `
<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
	<div style="max-width:620px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">

		<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;">
			<h1 style="margin:0;color:#fff;font-size:28px;font-weight:600;">Welcome!</h1>
			<p style="margin:10px 0 0;color:rgba(255,255,255,.9);font-size:15px;">
				Your account has been created successfully
			</p>
		</div>

		<div style="padding:40px 36px;">
			<p style="margin:0 0 18px;font-size:16px;color:#1f2937;line-height:1.6;">
				Hello,
			</p>

			<p style="margin:0 0 18px;font-size:16px;color:#4b5563;line-height:1.7;">
				An administrator has created an account for you on the platform.
				To activate your account, please set your password using the secure link below.
			</p>

			<div style="text-align:center;margin:36px 0;">
				<a
					href="${setupUrl}"
					style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;box-shadow:0 4px 14px rgba(37,99,235,.35);"
				>
					Set Your Password
				</a>
			</div>

			<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
				<p style="margin:0 0 10px;font-size:14px;color:#374151;">
					If the button doesn’t work, copy and paste this link into your browser:
				</p>
				<a
					href="${setupUrl}"
					style="color:#2563eb;font-size:14px;text-decoration:none;word-break:break-word;"
				>
					${setupUrl}
				</a>
			</div>

			<p style="margin:28px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
				For security reasons, this link will expire in <strong>24 hours</strong>.
			</p>
		</div>

		<div style="border-top:1px solid #e5e7eb;padding:20px 36px;background:#fafafa;">
			<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
				This is an automated message. Please do not reply.
			</p>
		</div>

	</div>
</div>
`;
}

export function getPasswordUpdatedHtml(loginUrl: string) {
return `
<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
	<div style="max-width:620px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">
		
		<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;">
			<h1 style="margin:0;color:#fff;font-size:28px;font-weight:600;">
				Password Changed
			</h1>
			<p style="margin:10px 0 0;color:rgba(255,255,255,.9);font-size:15px;">
				A change was made to your account credentials
			</p>
		</div>

		<div style="padding:40px 36px;">
			<p style="margin:0 0 18px;font-size:16px;color:#1f2937;line-height:1.6;">
				Hello,
			</p>

			<p style="margin:0 0 18px;font-size:16px;color:#4b5563;line-height:1.7;">
				Your account password has been successfully changed.
				You can now log in using your updated credentials.
			</p>

			<div style="text-align:center;margin:36px 0;">
				<a
					href="${loginUrl}"
					style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;box-shadow:0 4px 14px rgba(37,99,235,.35);"
				>
					Log In
				</a>
			</div>

			<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;">
				<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
					If you did not make this change, please report this immediately to the system administrator or relevant authority.
				</p>
			</div>
		</div>

		<div style="border-top:1px solid #e5e7eb;padding:20px 36px;background:#fafafa;">
			<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
				This is an automated security notification. Please do not reply.
			</p>
		</div>
	</div>
</div>
`;
}
