from fastapi import BackgroundTasks
import time

async def send_email_with_pdf(
    background_tasks: BackgroundTasks,
    subject: str,
    recipients: list,
    body: str,
    pdf_bytes: bytes,
    filename: str,
):
    """
    Simulated email sender for development — avoids real SMTP setup.
    Logs details in console and runs asynchronously.
    """
    def mock_send():
        print("📧 Simulating email send...")
        print(f"➡️ To: {', '.join(recipients)}")
        print(f"📄 Subject: {subject}")
        print(f"📎 Attachment: {filename} ({len(pdf_bytes)} bytes)")
        print("✅ Email successfully 'sent' (simulated).")

    # Run in background so FastAPI response returns immediately
    background_tasks.add_task(mock_send)
