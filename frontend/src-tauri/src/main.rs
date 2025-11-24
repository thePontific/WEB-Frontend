use tauri::command;
use reqwest;

#[command]
async fn make_insecure_request(url: String) -> Result<String, String> {
    println!("🔐 Making insecure request to: {}", url);
    
    let client = match reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build() {
            Ok(client) => client,
            Err(e) => {
                eprintln!("Failed to create HTTP client: {}", e);
                return Err(format!("HTTP client error: {}", e));
            }
        };

    let response = match client.get(&url).send().await {
        Ok(response) => response,
        Err(e) => {
            eprintln!("Request failed: {}", e);
            return Err(format!("Request error: {}", e));
        }
    };
    
    println!("Response status: {}", response.status());
    
    if response.status().is_success() {
        match response.text().await {
            Ok(body) => {
                println!("Request successful, body length: {}", body.len());
                Ok(body)
            },
            Err(e) => {
                eprintln!("Failed to read response body: {}", e);
                Err(format!("Body read error: {}", e))
            }
        }
    } else {
        let status = response.status();
        eprintln!("HTTP error: {}", status);
        Err(format!("HTTP error: {}", status))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![make_insecure_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}