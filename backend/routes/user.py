from fastapi import Request, APIRouter

import random

from models.message import User

COLORS = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
]

NAMES = [
    "Fox", "Otter", "Panda", "Hawk", "Dolphin", "Tiger", "Frog", "Koala",
    "Sloth", "Lynx", "Badger", "Moose", "Wolf", "Owl", "Cat", "Dog", "Boar"
]

router = APIRouter(prefix="/user", tags=["user"])
@router.get("/assign", response_model=User)
async def assign_user(request: Request):
    """
    Assign a random username and color to the client by their IP address.
    :return: A JSON object containing the username and color.
    """
    ip_address = request.client.host
    random.seed(ip_address)
    name = random.choice(NAMES)
    color = random.choice(COLORS)
    return User(name=name, color=color)