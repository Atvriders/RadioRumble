import socket
from datetime import datetime

def main():
    UDP_IP = "0.0.0.0"
    UDP_PORT = 8080
    LOG_FILE = "wsjtx_log.txt"

    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((UDP_IP, UDP_PORT))

    print(f"Listening for UDP packets on port {UDP_PORT}...")
    print(f"Logging all data to {LOG_FILE}\n")

    with open(LOG_FILE, "a", encoding="utf-8") as log:
        try:
            while True:
                data, addr = sock.recvfrom(4096)
                timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

                # Display to console
                print(f"[{timestamp}] Received {len(data)} bytes from {addr}")
                print(data)
                print("-" * 60)

                # Write to file
                log.write(f"[{timestamp}] From {addr} ({len(data)} bytes)\n")
                log.write(data.hex() + "\n")  # raw hex string
                try:
                    log.write(data.decode("utf-8", errors="ignore") + "\n")
                except Exception as e:
                    log.write(f"[Decode Error: {e}]\n")
                log.write("-" * 80 + "\n")
                log.flush()  # ensure immediate write to disk
        except KeyboardInterrupt:
            print("\nStopping listener...")
        finally:
            sock.close()
            print("Socket closed. Data saved to", LOG_FILE)


if __name__ == "__main__":
    main()