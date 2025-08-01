import net from "net";

// Helper function to find an available port
export async function findAvailablePort(
  startPort: number,
  maxRetries: number = 100
): Promise<number> {
  if (maxRetries <= 0) {
    return Promise.reject(
      new Error("No available ports found within the retry limit.")
    );
  }
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      findAvailablePort(startPort + 1, maxRetries - 1)
        .then(resolve)
        .catch(reject);
    });
    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo)?.port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}
