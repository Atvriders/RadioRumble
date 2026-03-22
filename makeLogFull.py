import random
import string
from datetime import datetime, timedelta
import os

NUM_RECORDS = 1000
LOG_FILE = "mock_raw_listener_output.txt"

# Main “contest” stations
core_stations = ["KE0VUM", "KD2FMW", "VA3OFF", "N0CALL", "W1XYZ"]
station_grids = {
    "KE0VUM": "EM19RF",
    "KD2FMW": "FN20",
    "VA3OFF": "FN04",
    "N0CALL": "EM29",
    "W1XYZ": "FN31",
}

# Active repetitive calls (random other ops)
frequent_calls = ["K4VHE", "K4UVU", "AC4WW", "WB0DHB", "N9F", "W4HIJ", "KF9UG", "K3NOQ"]

bands = {"20m": "14.074000", "40m": "7.074743", "15m": "21.074000"}
modes = ["FT8", "FT4"]
grids = ["EM19", "EN52", "FN20", "EN71", "EN91", "EM64", "EM83", "EL98", "FN30", "FM19", "EN82"]

# --- Basic helpers ----------------------------------------------------
def random_call():
    prefix = random.choice(["K", "N", "W", "AA", "AB", "KA", "KE", "KI", "KD"])
    suffix = "".join(random.choices(string.ascii_uppercase, k=random.randint(2, 3)))
    number = str(random.randint(0, 9))
    return f"{prefix}{number}{suffix}"

def random_hex_blob(min_len=200, max_len=260):
    # Make “fake” binary data as hex
    l = random.randint(min_len, max_len)
    raw = os.urandom(l // 2)
    return raw.hex()

def random_rst():
    sign = random.choice(["+", "-"])
    val = random.randint(1, 20)
    return f"{sign}{val:02d}"

# --- Build one QSO ----------------------------------------------------
def make_line():
    call = random.choice(frequent_calls) if random.random() < 0.4 else random_call()
    grid = random.choice(grids)
    mode = random.choice(modes)
    rst_sent = random_rst()
    rst_rcvd = random_rst()
    qso_date = datetime.utcnow().strftime("%Y%m%d")
    start = datetime.utcnow() - timedelta(seconds=random.randint(0, 7200))
    stop = start + timedelta(seconds=random.randint(30, 90))
    time_on = start.strftime("%H%M%S")
    time_off = stop.strftime("%H%M%S")
    band = random.choice(list(bands.keys()))
    freq = bands[band]
    station = random.choice(core_stations)
    my_grid = station_grids[station]

    adif = (
        f"<call:{len(call)}>{call} "
        f"<gridsquare:4>{grid} "
        f"<mode:{len(mode)}>{mode} "
        f"<rst_sent:3>{rst_sent} "
        f"<rst_rcvd:3>{rst_rcvd} "
        f"<qso_date:8>{qso_date} "
        f"<time_on:6>{time_on} "
        f"<qso_date_off:8>{qso_date} "
        f"<time_off:6>{time_off} "
        f"<band:{len(band)}>{band} "
        f"<freq:8>{freq} "
        f"<station_callsign:{len(station)}>{station} "
        f"<my_gridsquare:{len(my_grid)}>{my_grid} <eor>"
    )

    # Format the full listener block
    sep = "-" * 80
    ts = datetime.utcnow().strftime("[%Y-%m-%d %H:%M:%S.%f]")[:-3]
    port = random.randint(50000, 65000)
    hexdata = random_hex_blob()
    bytes_len = len(hexdata) // 2
    header = f"[2025-10-06 {datetime.utcnow().strftime('%H:%M:%S.%f')[:-3]}] From ('127.0.0.1', {port}) ({bytes_len} bytes)"
    block = (
        f"{sep}\n"
        f"{header}\n"
        f"{hexdata}\n"
        f"{adif}\n"
    )
    return block

# --- Generate log -----------------------------------------------------
def main():
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        for _ in range(NUM_RECORDS):
            f.write(make_line())
    print(f"✅ Created {NUM_RECORDS} realistic raw listener entries in '{LOG_FILE}'")

if __name__ == "__main__":
    main()
