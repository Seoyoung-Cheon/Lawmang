from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.schemas.memo import MemoUpdate
from app.models.memo import Memo
import pytz


# ✅ 메모리 캐시 추가 (전역 변수)
_view_cache = {}
CACHE_DURATION = 60  # 캐시 유효 시간 (초)

# ✅ 메모 저장
def create(db: Session, user_id: int, title: str, content: str = None, 
           event_date = None, notification: bool = False):
    try:
        if event_date and isinstance(event_date, str):
            event_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        new_memo = Memo(
            user_id=user_id,
            title=title,
            content=content,
            event_date=event_date,
            notification=notification
        )
        db.add(new_memo)
        db.commit()
        db.refresh(new_memo)
        return new_memo
    except SQLAlchemyError as e:
        print(f"🔥 메모 저장 오류: {e}")
        db.rollback()
        return None


# ✅ 사용자 메모 조회
def get_list(db: Session, user_id: int):
    return db.query(Memo).filter(
        Memo.user_id == user_id
    ).order_by(Memo.created_at.desc()).all()


# ✅ 메모 수정
def update(db: Session, memo_id: int, user_id: int, memo_data: MemoUpdate):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return None

        for field, value in memo_data.dict(exclude_unset=True).items():
            setattr(memo, field, value)

        db.commit()
        db.refresh(memo)
        return memo
    except SQLAlchemyError as e:
        print(f"🔥 메모 업데이트 오류: {e}")
        db.rollback()
        return None


# ✅ 캐시 정리 함수 추가
def cleanup_cache():
    current_time = datetime.utcnow()
    expired_keys = [
        key for key, (timestamp, _) in _view_cache.items()
        if (current_time - timestamp).total_seconds() > CACHE_DURATION
    ]
    for key in expired_keys:
        del _view_cache[key]


# ✅ 메모 삭제
def remove(db: Session, memo_id: int, user_id: int):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return False

        db.delete(memo)
        db.commit()
        return True
    except SQLAlchemyError as e:
        print(f"🔥 메모 삭제 오류: {e}")
        db.rollback()
        return False


# ✅ 알림 전송 프로세스
def check_and_send_notifications(db: Session):
    """
    현재 날짜 기준으로 event_date가 도래한 메모 중,
    notification이 활성화된 메모에 대해 이메일 알림을 전송합니다.
    (모델은 변경하지 않고 event_date와 notification 필드를 활용합니다.)
    """
    today = datetime.utcnow().date()
    # event_date가 오늘 이전(또는 오늘)이고, notification이 True인 메모 조회
    memos_to_notify = db.query(Memo).filter(
        Memo.notification == True,
        Memo.event_date != None,
        Memo.event_date <= today
    ).all()

    sent_count = 0
    for memo in memos_to_notify:
        if send_memo_notification_email(db, memo):
            sent_count += 1
    return sent_count


# ✅ 메모 알림 이메일 전송
def send_memo_notification_email(db: Session, memo):
    """
    메모의 알림 이메일을 전송하는 함수.
    (기존과 동일한 SMTP 전송 로직 사용)
    """
    from app.models.user import User
    user = db.query(User).filter(User.id == memo.user_id).first()
    if not user:
        print("사용자 정보를 찾을 수 없습니다.")
        return False

    subject = f"[Memo 알림] {memo.title}"
    body = (
        f"안녕하세요,\n\n"
        f"메모 '{memo.title}'에 설정된 알림 시간({memo.event_date})이 도래하였습니다.\n"
        f"내용: {memo.content}\n\n"
        f"감사합니다."
    )

    try:
        from app.services.user_service import SMTP_USER, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT
        from email.mime.text import MIMEText
        import smtplib

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = user.email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, user.email, msg.as_string())

        print(f"메모 알림 이메일 전송 완료: {user.email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print("SMTP 인증 실패: 이메일 또는 비밀번호가 올바르지 않습니다.")
        return False

    except smtplib.SMTPException as e:
        print(f"이메일 전송 실패: {e}")
        return False


# ✅ 알림 상태 수정
def update_alert(db: Session, memo_id: int, user_id: int, notification: bool):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return False

        memo.notification = notification
        db.commit()
        return True
    except SQLAlchemyError as e:
        print(f"🔥 알림 설정 업데이트 오류: {e}")
        db.rollback()
        return False