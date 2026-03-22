import random
from datetime import datetime, timedelta

# --- Parameters ---
NUM_QSOS = 1000
OUTPUT_FILE = "mock_contest_log.txt"

# Core callsigns (the main operators making most contacts)
core_stations = [
    "KE0VUM", "KD2FMW", "N0CALL", "VA3OFF", "W1XYZ"
]

# Each station's grid for realism
station_grids = {
    "KE0VUM": "EM19RF",
    "KD2FMW": "FN20",
    "N0CALL": "EM29",
    "VA3OFF": "FN04",
    "W1XYZ": "FN31",
}

# Smaller set of "active chasers" repeat more often
frequent_calls = [
    "N9F", "K4VHE", "AC4WW", "W4HIJ", "K3NOQ", "KF9UG",
    "WB0DHB", "N3JPV", "W1MKC", "K4UVU", "K7AMB"
]

# Pool of random suffixes and prefixes for variety
prefixes = ["K", "W", "N", "AA", "AB", "AC", "AD", "AE", "AF", "AI", "AK", "KB", "KC", "KD", "KE", "KF", "KI"]
suffixes = ["DX", "UV", "QK", "TX", "YY", "JJJ", "PT", "BF", "FQW", "ODS", "RA", "LM", "NB", "VU", "JT", "XP", "QA", "HM", "CM"]
grids = ["EM19", "EN52", "FN20", "EM29", "FM19", "EM64", "DM79", "EN82", "FM18", "EL98", "EM83", "EN71", "EN91", "EM79"]

bands = {
    "20m": "14.074000",
    "40m": "7.074743",
    "15m": "21.074000",
}
modes = ["FT8", "FT4"]

def make_random_call():
    prefix = random.choice(prefixes)
    suffix = random.choice(suffixes)
    num = random.randint(1, 9)
    return f"{prefix}{num}{suffix}"

def make_qso(core_station):
    # weight random contacts heavily from frequent_calls + random pool
    if random.random() < 0.6:
        call = random.choice(frequent_calls)
    else:
        call = make_random_call()
    grid = random.choice(grids)
    mode = random.choice(modes)
    sent = random.choice([f"+{str(random.randint(1, 20)).zfill(2)}", f"-{str(random.randint(1, 20)).zfill(2)}"])
    recv = random.choice([f"+{str(random.randint(1, 20)).zfill(2)}", f"-{str(random.randint(1, 20)).zfill(2)}"])
    qso_date = datetime.utcnow().strftime("%Y%m%d")

    start_time = datetime.utcnow() - timedelta(minutes=random.randint(0, 300))
    end_time = start_time + timedelta(seconds=random.randint(30, 90))
    band = random.choice(list(bands.keys()))
    freq = bands[band]

    t_on = start_time.strftime("%H%M%S")
    t_off = end_time.strftime("%H%M%S")

    my_grid = station_grids[core_station]
    station_call = core_station

    adif = (
        f"<call:{len(call)}>{call} "
        f"<gridsquare:4>{grid} "
        f"<mode:{len(mode)}>{mode} "
        f"<rst_sent:3>{sent} "
        f"<rst_rcvd:3>{recv} "
        f"<qso_date:8>{qso_date} "
        f"<time_on:6>{t_on} "
        f"<qso_date_off:8>{qso_date} "
        f"<time_off:6>{t_off} "
        f"<band:{len(band)}>{band} "
        f"<freq:8>{freq} "
        f"<station_callsign:{len(station_call)}>{station_call} "
        f"<my_gridsquare:{len(my_grid)}>{my_grid} <eor>"
    )
    return adif

def main():
    all_lines = []
    for _ in range(NUM_QSOS):
        main_station = random.choices(core_stations, weights=[30, 25, 20, 15, 10])[0]
        all_lines.append(make_qso(main_station))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for l in all_lines:
            f.write(l + "\n")

    print(f"✅ Generated {NUM_QSOS} mock QSO entries in '{OUTPUT_FILE}'")
    print(f"Core stations: {', '.join(core_stations)}")
    print(f"Random unique contacts: ~{len(frequent_calls) + 80} simulated")

if __name__ == "__main__":
    main()
