import { onObjectFinalized } from "firebase-functions/v2/storage";
import { logger } from "firebase-functions";
import nodemailer from "nodemailer";

export const sendEmail = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  logger.info(`📦 新しいファイルがアップロードされました: ${filePath}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hryoga8723@gmail.com",
      pass: "20020126",
    },
  });

  const mailOptions = {
    from: "hryoga8723@gmail.com",
    to: "hryoga8723@gmail.com",
    subject: "Firebase Storage にファイルがアップロードされました",
    text: `ファイルパス: ${filePath}`,
  };

  await transporter.sendMail(mailOptions);
  logger.info("✅ メール送信完了");
});
