from fastapi import Request, APIRouter

import random

from app.models.message import User

COLORS = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#800000", "#808000",
]

NAMES = [
    "Fox", "Otter", "Panda", "Hawk", "Dolphin", "Tiger", "Frog", "Koala",
    "Sloth", "Lynx", "Badger", "Moose", "Wolf", "Owl", "Cat", "Dog", "Boar",
    "Bear", "Eagle", "Falcon", "Rabbit", "Deer", "Bison", "Crow", "Swan",
    "Pelican", "Seal", "Weasel", "Mole", "Beaver", "Coyote", "Crane", "Shark",
    "Orca", "Whale", "Lizard", "Gecko", "Iguana", "Raccoon", "Chimp", "Gorilla",
    "Hyena", "Leopard", "Jaguar", "Antelope", "Camel", "Gazelle", "Lemur",
    "Giraffe", "Rhino", "Hippo", "Zebra", "Buffalo", "Donkey", "Parrot", "Peacock",
    "Turkey", "Flamingo", "Pigeon", "Magpie", "Robin", "Wren", "Vulture", "Heron",
    "Toad", "Newt", "Salamander", "Chinchilla", "Hedgehog", "Skunk", "Ferret",
    "Wombat", "Armadillo", "Meerkat", "Mongoose", "Tapir", "Okapi", "Manatee",
    "Narwhal", "Walrus", "Caribou", "Cougar", "Bobcat", "Kangaroo", "Wallaby",
    "Emu", "Cassowary", "Tamarin", "Ocelot", "Puma", "Macaw", "Kestrel", "Jay",
    "Stork", "Quokka", "Aardvark", "Echidna", "Platypus", "Tasmanian Devil",
    "Capybara", "Porcupine", "Arctic Fox", "Snow Leopard", "Red Panda", "Squirrel",
    "Chipmunk", "Prairie Dog", "Groundhog", "Beetle", "Butterfly", "Dragonfly",
    "Grasshopper", "Cricket", "Ant", "Bee", "Wasp", "Spider", "Scorpion",
    "Centipede", "Millipede", "Snail", "Slug", "Earthworm", "Jellyfish",
    "Starfish", "Sea Urchin", "Coral", "Anemone", "Octopus", "Squid", "Crab",
    "Lobster", "Shrimp", "Clam"
]

router = APIRouter(prefix="/user", tags=["user"])
@router.get("/assign", response_model=User)
async def assign_user(request: Request):
    """
    Assign a random username and color to the client by their IP address.
    :return: A JSON object containing the username and color.
    """
    x_forwarded_for = request.headers.get("x-forwarded-for")
    ip_address = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.client.host

    random.seed(ip_address)
    name = random.choice(NAMES)
    color = random.choice(COLORS)
    return User(name=name, color=color)