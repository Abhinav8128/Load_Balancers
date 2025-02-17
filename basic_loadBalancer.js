const http = require('http'); // Import the HTTP module to create a server
const { request } = require('http'); // Import request from HTTP module (not needed explicitly here)

// Define backend servers to distribute traffic between
const servers = ['http://localhost:2308', 'http://localhost:7235'];

let current = 0; // Keep track of which server to use (round-robin index)

// Create a load balancer server
const loadBalancer = http.createServer((req, res) => {
  // Select the target server based on round-robin strategy
  const target = servers[current];
  current = (current + 1) % servers.length; // Move to the next server

  // Forward the request to the selected backend server
  const proxy = http.request(target + req.url, { 
    method: req.method, // Forward the original request method (GET, POST, etc.)
    headers: req.headers // Forward the original request headers
  }, (proxyRes) => {
    // When the backend responds, pass the response back to the client
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true }); // Pipe the backend response to the client response
  });

  // Pipe the client's request data to the backend server
  req.pipe(proxy, { end: true });

  // Handle errors if the backend server is down or unreachable
  proxy.on('error', (err) => {
    res.writeHead(500);
    res.end('Server error: ' + err.message);
  });
});

// Start the load balancer on port 3000
loadBalancer.listen(3000, () => {
  console.log('Load Balancer running on port 3000');
});
