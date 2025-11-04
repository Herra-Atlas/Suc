<?php
// --- VIRHEIDENKÄSITTELY ---
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');
error_reporting(E_ALL);

// --- YLEISET OTSIKOT ---
// Sallitaan kaikki lähteet ja metodit.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Jos pyyntö on OPTIONS (CORS preflight), vastataan OK ja lopetetaan.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// ============================================
// KONFIGURAATIO
// =ystävällinen sivu käyttäjälle ja kirjoitetaan virhe lokiin.
function handle_fatal_error($message, $exception = null) {
    if ($exception) {
        error_log($message . ": " . $exception->getMessage());
    } else {
        error_log($message);
    }
    // Palautetaan aina JSON-virhe API-kutsuille
    if (isset($_GET['action']) && in_array($_GET['action'], ['check_login', 'oauth_google', 'oauth_discord'])) {
        http_response_code(500);
        header("Content-Type: application/json");
        echo json_encode(['error' => $message]);
    } else {
        // Tai näytä siisti HTML-sivu
        echo "<h1>Palvelinvirhe</h1><p>Tapahtui odottamaton virhe.</p>";
    }
    exit();
}


// ============================================
// TIETOKANNAN JA OAuth-ASETUKSET
// ============================================
$db_host = 'Replace';
$db_user = 'Replace';
$db_pass = 'Replace';
$db_name = 'Replace';

$google_client_id = 'Replace-Replace.apps.googleusercontent.com';
$google_client_secret = 'Replace-Replace';
$discord_client_id = 'Replace';
$discord_client_secret = 'Replace-Replace-Replace';

$allowed_origins = [
    'tauri://localhost',      // Sallii build-version
    'http://localhost:1420'   // Sallii dev-version (tarkista portti tarvittaessa)
];

// Important: Kaikki ohjaukset tulevat takaisin tähän tiedostoon
$base_redirect_uri = 'https://meikahoitaa.fi/apps/suc.php'; // KÄYTÄ HTTPS-VERSIOTA

// --- Yhteyden luonti ---
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Tietokantavirhe.");
}

// --- Toiminnon valinta ---
$action = $_GET['action'] ?? null;

// Reititin, joka kutsuu oikeaa funktiota
switch ($action) {
    case 'start_login':
        handle_start_login();
        break;
    case 'oauth_google':
        handle_oauth_callback('google');
        break;
    case 'oauth_discord':
        handle_oauth_callback('discord');
        break;
    case 'check_login':
        handle_check_login();
        break;
    default:
        // Oletusarvoisesti ei tehdä mitään tai näytetään virhe
        http_response_code(404);
        echo "Virheellinen toiminto.";
        break;
}

// --- TOIMINTOJEN KÄSITTELIJÄT ---

function handle_start_login() {
    global $google_client_id, $discord_client_id, $base_redirect_uri;
    $session_id = $_GET['session_id'] ?? null;
    if (!$session_id) die("Istunnon ID puuttuu.");
    
    $_SESSION['session_id'] = $session_id;

    $google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=$google_client_id&redirect_uri=" . urlencode($base_redirect_uri . '?action=oauth_google') . "&scope=openid%20email%20profile&access_type=offline&prompt=consent";
    $discord_auth_url = "https://discord.com/api/oauth2/authorize?client_id=$discord_client_id&redirect_uri=" . urlencode($base_redirect_uri . '?action=oauth_discord') . "&response_type=code&scope=identify%20email";

    // --- UUSI, MODERNI HTML JA CSS ---
    $css = <<<CSS
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    :root { --bg-start: #1a1a2e; --bg-end: #16213e; --card-bg: rgba(255, 255, 255, 0.05); --text: #e0e0e0; --text-muted: #a0a0b0; }
    body { font-family: 'Inter', sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, var(--bg-start), var(--bg-end)); color: var(--text); overflow: hidden; }
    .card { background: var(--card-bg); backdrop-filter: blur(20px); padding: 3rem 4rem; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.3); text-align: center; animation: floatIn 1s ease-out both; }
    h1 { font-size: 2.5rem; margin-top: 0; margin-bottom: 0.5rem; font-weight: 700; }
    p { color: var(--text-muted); margin-bottom: 2.5rem; }
    .buttons { display: flex; flex-direction: column; gap: 1rem; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; font-size: 1rem; font-weight: 500; text-decoration: none; color: white; background-color: rgba(255,255,255,0.08); transition: all 0.3s ease; }
    .btn:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); border-color: rgba(255, 255, 255, 0.3); background-color: rgba(255,255,255,0.15); }
    .btn.google:hover { border-color: #4285F4; }
    .btn.discord:hover { border-color: #5865F2; }
    .btn svg { width: 24px; height: 24px; }
    @keyframes floatIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
CSS;

    $html = <<<HTML
    <!DOCTYPE html><html lang="fi"><head><title>Kirjaudu Suc Appiin</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>$css</style></head>
    <body><div class="card">
        <h1>Tervetuloa</h1>
        <p>Valitse tapa kirjautua sisään.</p>
        <div class="buttons">
            <a href="$google_auth_url" class="btn google">
                <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.53-1.94 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.83-2.22.83-2.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span>Jatka Google-tilillä</span>
            </a>
            <a href="$discord_auth_url" class="btn discord">
                <svg fill="#ffffff" viewBox="0 0 24 24"><path d="M20.3,3.5c-1.4-0.8-3-1.4-4.6-1.8C15.6,1.6,15.5,1.5,15.4,1.4c-0.2-0.1-0.4-0.2-0.6-0.2c-0.2,0-0.4,0-0.5,0.1 C14,1.3,13.8,1.4,13.7,1.5c-0.8,0.7-1.4,1.4-2,2.2C11.1,4.3,10.6,5,10,5.7c-2-0.2-4-0.7-5.9-1.6C4,4,3.9,4,3.8,4.1 C3.7,4.1,3.6,4.2,3.6,4.3C2.1,7.4,1.4,10.6,1.7,13.8c0,0.1,0.1,0.3,0.2,0.3c0.1,0.1,0.3,0.1,0.4,0.1c2,0,3.9-0.3,5.7-0.9 c0.1,0,0.2-0.1,0.2-0.2c0.3-0.5,0.6-1,0.8-1.5c-2.4,0.6-4.9,0.9-7.3,0.9c-0.1,0-0.3,0.1-0.4,0.2c-0.1,0.1-0.1,0.3-0.1,0.4 c0.5,2.2,1.6,4.3,3.3,6c0.1,0.1,0.2,0.2,0.4,0.2c0.1,0,0.3-0.1,0.4-0.2c1.2-0.6,2.3-1.4,3.4-2.2c0.6-0.5,1.2-1,1.8-1.6 c2.5,1,5.1,1.3,7.8,1c0.1,0,0.3-0.1,0.4-0.2c0.1-0.1,0.1-0.2,0.1-0.4c-0.1-2.4-0.8-4.8-1.9-7c0-0.1-0.1-0.2-0.2-0.3 c-0.1-0.1-0.3-0.1-0.4-0.1c-1.7,0.8-3.5,1.4-5.3,1.8c0.4-0.8,0.8-1.7,1.1-2.5c0.6-1.1,1.1-2.2,1.5-3.3c0.1-0.1,0.1-0.3,0-0.4 C20.6,3.7,20.4,3.6,20.3,3.5z M8.6,13.4c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3s1.3,0.6,1.3,1.3S9.3,13.4,8.6,13.4z M15.4,13.4 c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3s1.3,0.6,1.3,1.3S16.1,13.4,15.4,13.4z"/></svg>
                <span>Jatka Discord-tilillä</span>
            </a>
        </div>
    </div></body></html>
HTML;

    header("Content-Type: text/html; charset=utf-8");
    echo $html;
    exit();
}

function handle_oauth_callback($provider) {
    global $pdo, $google_client_id, $google_client_secret, $discord_client_id, $discord_client_secret, $base_redirect_uri;
    $code = $_GET['code'] ?? null;
    $session_id = $_SESSION['session_id'] ?? null;

    if (!$code || !$session_id) {
        die("Virhe: Koodi tai istunto puuttuu.");
    }

    $user_info = null;

    if ($provider === 'google') {
        $token_url = 'https://oauth2.googleapis.com/token';
        $params = ['code' => $code, 'client_id' => $google_client_id, 'client_secret' => $google_client_secret, 'redirect_uri' => $base_redirect_uri . '?action=oauth_google', 'grant_type' => 'authorization_code'];
        $token_data = exchange_code_for_token($token_url, $params);
        $user_info_raw = get_user_info('https://www.googleapis.com/oauth2/v3/userinfo', $token_data['access_token']);
        $user_info = ['oauth_id' => $user_info_raw['sub'], 'username' => $user_info_raw['name'], 'email' => $user_info_raw['email'], 'pfp_url' => $user_info_raw['picture']];
    } elseif ($provider === 'discord') {
        $token_url = 'https://discord.com/api/oauth2/token';
        $params = ['client_id' => $discord_client_id, 'client_secret' => $discord_client_secret, 'grant_type' => 'authorization_code', 'code' => $code, 'redirect_uri' => $base_redirect_uri . '?action=oauth_discord'];
        $token_data = exchange_code_for_token($token_url, $params, true);
        $user_info_raw = get_user_info('https://discord.com/api/users/@me', $token_data['access_token']);
        $pfp_url = "https://cdn.discordapp.com/avatars/{$user_info_raw['id']}/{$user_info_raw['avatar']}.png";
        $user_info = ['oauth_id' => $user_info_raw['id'], 'username' => $user_info_raw['username'], 'email' => $user_info_raw['email'], 'pfp_url' => $pfp_url];
    }

    if (!$user_info) {
        die("Käyttäjätietojen haku epäonnistui.");
    }
    
    // Etsi tai luo käyttäjä tietokantaan
    $stmt = $pdo->prepare("SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?");
    $stmt->execute([$provider, $user_info['oauth_id']]);
    $user = $stmt->fetch();

    if ($user) {
        // Päivitä olemassa oleva
        $stmt = $pdo->prepare("UPDATE users SET username = ?, pfp_url = ?, last_ip = ? WHERE id = ?");
        $stmt->execute([$user_info['username'], $user_info['pfp_url'], $_SERVER['REMOTE_ADDR'], $user['id']]);
    } else {
        // Luo uusi
        $stmt = $pdo->prepare("INSERT INTO users (oauth_provider, oauth_id, username, email, pfp_url, last_ip) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$provider, $user_info['oauth_id'], $user_info['username'], $user_info['email'], $user_info['pfp_url'], $_SERVER['REMOTE_ADDR']]);
    }

    // Hae lopullinen käyttäjädata
    $stmt = $pdo->prepare("SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?");
    $stmt->execute([$provider, $user_info['oauth_id']]);
    $final_user = $stmt->fetch();

    // Päivitä auth_sessions-taulu
    $stmt = $pdo->prepare("INSERT INTO auth_sessions (session_id, status, user_data) VALUES (?, 'completed', ?) ON DUPLICATE KEY UPDATE status='completed', user_data=?");
    $stmt->execute([$session_id, json_encode($final_user), json_encode($final_user)]);
    
    // Tyhjennä PHP-istunto
    session_destroy();

    // --- UUSI, MODERNI ONNISTUMISSIVU ---
    $username = htmlspecialchars($final_user['username']);
    $css = <<<CSS
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    :root { --bg-start: #1a1a2e; --bg-end: #16213e; --card-bg: rgba(255, 255, 255, 0.05); --text: #e0e0e0; --text-muted: #a0a0b0; --primary: #4CAF50; }
    body { font-family: 'Inter', sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, var(--bg-start), var(--bg-end)); color: var(--text); overflow: hidden; }
    .card { background: var(--card-bg); backdrop-filter: blur(20px); padding: 3rem 4rem; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.3); text-align: center; animation: zoomIn 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) both; }
    h1 { font-size: 2rem; margin-top: 0; margin-bottom: 0.5rem; color: var(--primary); }
    .username { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; word-break: break-all; }
    p { font-size: 1rem; color: var(--text-muted); }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
CSS;
    
    $html = <<<HTML
    <!DOCTYPE html><html lang="fi"><head><title>Kirjautuminen onnistui</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>$css</style></head>
    <body><div class="card">
        <h1>Kirjautuminen onnistui!</h1>
        <div class="username">$username</div>
        <p>Voit nyt sulkea tämän selainikkunan.</p>
    </div></body></html>
HTML;
    
    header("Content-Type: text/html; charset=utf-8");
    echo $html;
    exit();
}

function handle_check_login() {
    global $pdo, $allowed_origins;
    
    // TÄRKEÄÄ: Aseta CORS- ja JSON-otsikot VAIN TÄLLE API-VASTAUKSELLE
    if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
    header("Content-Type: application/json");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
    
    $session_id = $_GET['session_id'] ?? null;
    if (!$session_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Session ID puuttuu']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT * FROM auth_sessions WHERE session_id = ?");
    $stmt->execute([$session_id]);
    $session = $stmt->fetch();

    if ($session && $session['status'] === 'completed') {
        $stmt = $pdo->prepare("DELETE FROM auth_sessions WHERE session_id = ?");
        $stmt->execute([$session_id]);
        echo json_encode(['status' => 'completed', 'user' => json_decode($session['user_data'])]);
    } else {
        echo json_encode(['status' => 'pending']);
    }
    exit();
}

// Apufunktiot cURL-pyynnöille
function exchange_code_for_token($url, $params, $is_discord = false) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    if ($is_discord) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    }
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

function get_user_info($url, $access_token) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $access_token]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}