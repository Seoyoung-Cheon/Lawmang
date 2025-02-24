from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core import get_db


router = APIRouter()

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]