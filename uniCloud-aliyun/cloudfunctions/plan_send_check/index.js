/**
 * 计划发送检查云函数
 * 由定时触发器每分钟执行，查询符合条件的用户并发邮件，发完后将 send_time 置为 null（仅执行一次）
 */
'use strict';

const nodemailer = require('nodemailer');

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const now = Date.now();

	// 查询条件：enable_sending === true，send_time <= 当前时间，send_time 不为 null
	const { data: users } = await db.collection('users').where({
		enable_sending: true,
		send_time: db.command.and(db.command.neq(null), db.command.lte(now))
	}).get();

	// 筛选满足全部条件的用户
	const toProcess = users.filter(u => {
		const displayName = String(u.send_display_name || '').trim();
		const message = String(u.send_message || '').trim();
		const emails = Array.isArray(u.send_emails) ? u.send_emails : [];
		return displayName !== '' && message !== '' && emails.length > 0;
	});

	if (toProcess.length === 0) {
		return { processed: 0, message: '无符合发送条件的用户' };
	}

	// 创建 SMTP transporter（环境变量：SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM）
	const host = process.env.SMTP_HOST || '';
	const port = parseInt(process.env.SMTP_PORT || '465', 10);
	const user = process.env.SMTP_USER || '';
	const pass = process.env.SMTP_PASS || '';
	const fromAddr = process.env.SMTP_FROM || user;

	if (!host || !user || !pass) {
		console.error('SMTP 环境变量未配置：SMTP_HOST, SMTP_USER, SMTP_PASS');
		return { errCode: 'SMTP_NOT_CONFIGURED', errMsg: '邮件服务未配置', processed: 0 };
	}

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});

	const results = [];
	for (const user of toProcess) {
		const uid = user._id;
		const displayName = String(user.send_display_name || '').trim();
		const clueInfo = String(user.send_message || '').trim();
		const emails = Array.isArray(user.send_emails) ? user.send_emails.filter(e => e && String(e).trim()) : [];

		const body = `你好，

如果你收到了这条通知，${displayName} 可能暂时无法亲自与你联系。${displayName} 在 Plan B（后手）App 中预留了一份「人生备份计划」。
查找线索：请从${clueInfo}开始查找。
谢谢你的帮助。
—— Plan B（后手）`;

		let sendOk = true;
		for (const to of emails) {
			const toEmail = String(to).trim().toLowerCase();
			if (!toEmail) continue;
			try {
				await transporter.sendMail({
					from: fromAddr,
					to: toEmail,
					subject: '【Plan B】人生备份计划通知',
					text: body
				});
			} catch (e) {
				console.error(`发送邮件失败 uid=${uid} to=${toEmail}`, e);
				sendOk = false;
			}
		}

		// 发完后将该用户 send_time 置为 null，实现仅执行一次
		try {
			await db.collection('users').doc(uid).update({ send_time: null });
		} catch (e) {
			console.error(`更新 send_time 失败 uid=${uid}`, e);
		}

		results.push({ uid, emails: emails.length, sendOk });
	}

	return { processed: results.length, results };
};
