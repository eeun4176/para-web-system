// LANGUAGE: English / Filipino (passenger pages)
// The pages are written in English. When Filipino is chosen, this file swaps each visible English text
// (and placeholders, tooltips, screen-reader labels, the tab title) for its Filipino version from the lists
// below. Text that scripts add later (results, toasts, server messages) is translated as it appears.
// Names (places, people, landmarks) are not in the lists, so they never change.
// Loaded in <head> right after early-theme.js, so Filipino is applied before the page is drawn.
// The choice is kept in localStorage ('para_lang'). The EN / FIL button is added next to the dark mode button.

const FIL = {
    // ---- Tab titles ----
    'Para | SJDM Fare Calculator': 'Para | Kalkulador ng Pamasahe sa SJDM',
    'Calculate | Para SJDM Fare Calculator': 'Kalkulahin | Para: Kalkulador ng Pamasahe sa SJDM',
    'About | Para SJDM Fare Calculator': 'Tungkol | Para: Kalkulador ng Pamasahe sa SJDM',
    'Log In | Para SJDM Fare Calculator': 'Mag-log In | Para: Kalkulador ng Pamasahe sa SJDM',
    'Account Settings | Para SJDM Fare Calculator': 'Settings ng Account | Para: Kalkulador ng Pamasahe sa SJDM',

    // ---- Navigation, footer, shared buttons ----
    'Home': 'Simula',
    'Calculate': 'Kalkulahin',
    'About Us': 'Tungkol sa Amin',
    'Log In': 'Mag-log In',
    'Sign Up': 'Mag-sign Up',
    'Log Out': 'Mag-log Out',
    'Account Settings': 'Settings ng Account',
    'Help & FAQs': 'Tulong at FAQs',
    '© 2026 Para. All rights reserved.': '© 2026 Para. Nakalaan ang lahat ng karapatan.',
    'Main navigation': 'Pangunahing nabigasyon',
    'Site navigation': 'Nabigasyon ng site',
    'Mobile navigation': 'Nabigasyon sa mobile',
    'Open menu': 'Buksan ang menu',
    'Close menu': 'Isara ang menu',
    'Toggle dark mode': 'Palitan ang dark mode',
    'Open profile menu': 'Buksan ang menu ng profile',
    'Back to top': 'Bumalik sa itaas',
    'Para: back to the calculator': 'Para: bumalik sa kalkulador',
    'Back to the calculator': 'Bumalik sa kalkulador',
    'Footer': 'Footer',
    'Cancel': 'Kanselahin',
    'Close': 'Isara',
    'Confirm': 'Kumpirmahin',
    'Save': 'I-save',
    'Edit': 'I-edit',
    'Change': 'Palitan',
    'Delete': 'Burahin',
    'Remove': 'Alisin',
    'Done': 'Tapos na',
    'Dismiss': 'Isara',
    'Loading...': 'Naglo-load...',
    'Are you sure?': 'Sigurado ka ba?',

    // ---- Toast titles ----
    'Something went wrong': 'May nagkaproblema',
    'Heads up': 'Paalala',
    'Good to know': 'Mabuting malaman',

    // ---- Home: hero ----
    'Commuter guide for San Jose del Monte': 'Gabay ng commuter sa San Jose del Monte',
    'Know Your Fare Before You Ride.': 'Alamin ang Pamasahe Bago Sumakay.',
    "Tell Para where you're going. It maps the route, estimates the travel time and works out the exact jeepney or bus fare for you.":
        'Sabihin kay Para kung saan ka pupunta. Ipapakita niya ang ruta, tatantiyahin ang oras ng biyahe at kukuwentahin ang eksaktong pamasahe sa jeep o bus.',
    'Start Your Commute': 'Simulan ang Biyahe',
    'Watch Demo': 'Panoorin ang Demo',
    'See Para in Action': 'Panoorin si Para',
    'A one-minute tour: search, road route, fare with discounts, saved trips, and the admin side.':
        'Isang minutong silip: paghahanap, ruta sa kalsada, pamasahe na may diskwento, mga naka-save na biyahe, at ang panig ng admin.',
    'Para on Facebook': 'Si Para sa Facebook',
    'Para on Instagram': 'Si Para sa Instagram',
    'Map showing a jeepney route from Tungko to Muzon': 'Mapa ng ruta ng jeep mula Tungko hanggang Muzon',
    'Your fare: ₱13.00': 'Pamasahe mo: ₱13.00',
    'Modern jeepney · Student': 'Modern jeepney · Estudyante',
    'Arrived': 'Nakarating na',

    // ---- Home: how it works ----
    'Three easy steps': 'Tatlong madaling hakbang',
    'How Para Works': 'Paano Gumagana ang Para',
    'Pick Your Perch': 'Piliin ang Iyong Puwesto',
    'Search for your start and end points in San Jose del Monte.': 'Hanapin ang simula at dulo ng biyahe mo sa San Jose del Monte.',
    'Let Para Calculate': 'Hayaang Magkuwenta si Para',
    'Para uses the latest LTFRB fare matrix and computes your fare instantly.': 'Ginagamit ni Para ang pinakabagong fare matrix ng LTFRB at agad na kinukuwenta ang pamasahe mo.',
    'See Your Path': 'Tingnan ang Iyong Daan',
    'Watch your route appear on the map and get a note if your stop needs a short walk or a tricycle.':
        'Panoorin ang ruta mo sa mapa at alamin kung kailangan mong maglakad nang kaunti o mag-tricycle.',

    // ---- Home: features ----
    'Built for SJDM': 'Ginawa para sa SJDM',
    'Para Features': 'Mga Feature ng Para',
    'Live Fare Matrix': 'Updated na Fare Matrix',
    'Always updated with the latest fare rates, including student, senior and PWD discounts.':
        'Laging updated sa pinakabagong pamasahe, kasama ang diskwento ng estudyante, senior at PWD.',
    'Interactive SJDM Map': 'Interactive na Mapa ng SJDM',
    'A modern map powered by MapLibre and OpenStreetMap, with your own saved landmarks.':
        'Modernong mapa mula sa MapLibre at OpenStreetMap, kasama ang mga landmark na na-save mo.',
    'Access Alerts': 'Mga Paalala sa Daan',
    "Know right away if a place needs a tricycle 'Special Trip' or a short walk.":
        "Malalaman mo agad kung kailangan ng tricycle 'Special Trip' o maikling lakad.",

    // ---- Home: meet Para ----
    'Your guide': 'Ang gabay mo',
    'Meet Para': 'Kilalanin si Para',
    "Para is inspired by the Philippine Hanging Parrot (Colasisi), small, quick and at home in the local skies. He's your eye in the sky for commuting around SJDM.":
        'Hango si Para sa Colasisi (Philippine Hanging Parrot): maliit, mabilis at sanay sa ating himpapawid. Siya ang mata mo sa langit sa pag-commute sa SJDM.',
    "Behind the mascot is Para's fare engine: It measures your trip on the real roads, applies your discount and shows the whole route on the map.":
        'Sa likod ng mascot ay ang fare engine ni Para: Sinusukat nito ang biyahe mo sa totoong kalsada, inilalapat ang diskwento mo at ipinapakita ang buong ruta sa mapa.',

    // ---- Home: FAQ ----
    'Help': 'Tulong',
    'Frequently Asked Questions': 'Mga Madalas Itanong',
    'How does Para compute my fare?': 'Paano kinukuwenta ni Para ang pamasahe ko?',
    'Para uses the LTFRB fare matrix saved in our database: a base fare for the first kilometers, plus a set amount for every kilometer after that. The distance comes from the road route shown on the map, and the fare is rounded to the nearest peso.':
        'Ginagamit ni Para ang fare matrix ng LTFRB na nasa aming database: May base fare para sa unang mga kilometro, at may dagdag sa bawat susunod na kilometro. Ang layo ay batay sa ruta sa kalsada na makikita sa mapa, at ibinibilog ang pamasahe sa pinakamalapit na piso.',
    'Why might the real fare be a little different?': 'Bakit puwedeng medyo iba ang totoong pamasahe?',
    "Drivers can take a different road, and traffic changes the travel time. Para's numbers are a close estimate so you know what to prepare before you ride.":
        'Puwedeng ibang daan ang dumaanan ng driver, at nag-iiba ang oras dahil sa trapiko. Malapit na tantiya ang mga numero ni Para para alam mo ang ihahanda bago sumakay.',
    'Are student, senior and PWD discounts automatic?': 'Awtomatiko ba ang diskwento ng estudyante, senior at PWD?',
    'Yes. Pick your passenger type and the 20% discount is applied right away. Remember to show your valid ID to the driver or conductor.':
        'Oo. Piliin ang uri ng pasahero at agad na ilalapat ang 20% diskwento. Huwag kalimutang ipakita ang valid ID sa driver o konduktor.',
    'What does "walk" or "ride a tricycle" mean on my result?': 'Ano ang ibig sabihin ng "maglakad" o "mag-tricycle" sa resulta ko?',
    'Jeepneys and buses only use the main roads. If your starting point or your stop is away from them, Para tells you to walk that part or take a tricycle (special trip), which is paid separately.':
        'Sa malalaking kalsada lang dumadaan ang jeep at bus. Kung malayo roon ang pinanggalingan o hintuan mo, sasabihan ka ni Para na maglakad sa bahaging iyon o mag-tricycle (special trip), na hiwalay ang bayad.',
    'Do I need an account?': 'Kailangan ko ba ng account?',
    'No. Anyone can calculate fares. With a free account you can also save favorite routes, your recent trips and your own landmarks.':
        'Hindi. Kahit sino ay puwedeng magkuwenta ng pamasahe. Sa libreng account, puwede mo ring i-save ang paboritong ruta, mga huling biyahe at sarili mong landmark.',

    // ---- About ----
    'About us': 'Tungkol sa amin',
    "Kumusta! I'm Para": 'Kumusta! Ako si Para',
    'Your digital guide designed to improve your daily commute in San Jose del Monte by providing real-time navigation and updates.':
        'Ang iyong digital na gabay para mapagaan ang araw-araw mong pag-commute sa San Jose del Monte sa tulong ng real-time na nabigasyon at updates.',
    'I was hatched with a single mission: Making sure no commuter ever has to guess their fare or lose their way again.':
        'Napisa ako na may iisang misyon: Siguraduhing wala nang commuter na manghuhula ng pamasahe o maliligaw pa.',
    'What Para stands for': 'Ang pinaninindigan ni Para',
    'Precision': 'Katumpakan',
    'I calculate the exact distance of your trip and apply your student, senior or PWD discount for you.':
        'Kinukuwenta ko ang eksaktong layo ng biyahe mo at inilalapat ang diskwento mo bilang estudyante, senior o PWD.',
    '4.2 km · Modern jeepney · Student': '4.2 km · Modern jeepney · Estudyante',
    '20% discount applied': 'May 20% diskwento',
    'Peace of Mind': 'Panatag na Loob',
    'Knowing your fare and route options before you ride makes your day smoother and less stressful.':
        'Kapag alam mo ang pamasahe at ruta bago sumakay, mas magaan at hindi nakaka-stress ang araw mo.',
    'Community Flock': 'Kawan ng Komunidad',
    "This isn't just a map. By marking your own perches, you help me grow smarter every day.":
        'Hindi lang ito basta mapa. Sa pagmamarka mo ng sarili mong puwesto, natutulungan mo akong maging mas matalino araw-araw.',
    "Let's Fly Together and Master the Roads of SJDM. Para Po!": "Sabay Tayong Lumipad at Kabisaduhin ang mga Daan ng SJDM. Para Po!",

    // ---- Log in (email, code, password) ----
    'Continue as Guest': 'Magpatuloy bilang Guest',
    'Know your fare before you ride.': 'Alamin ang pamasahe bago sumakay.',
    'Para · fare and route guide for San Jose del Monte': 'Para · gabay sa pamasahe at ruta sa San Jose del Monte',
    'Fare calculated': 'Nakuwenta na ang pamasahe',
    'Tungko → Muzon, just now': 'Tungko → Muzon, ngayon lang',
    'Your trips this week': 'Mga biyahe mo ngayong linggo',
    '3 more': '3 pa',
    'Discount applied': 'May diskwento',
    'Student, senior and PWD: 20% off': 'Estudyante, senior at PWD: 20% bawas',
    'Welcome Back': 'Maligayang Pagbabalik',
    'Or continue with email': 'O magpatuloy gamit ang email',
    'Welcome to Para': 'Maligayang pagdating sa Para',
    'Log in or create a free account to save your trips, favorite routes and landmarks.':
        'Mag-log in o gumawa ng libreng account para ma-save ang mga biyahe, paboritong ruta at landmark mo.',
    'Continue': 'Magpatuloy',
    'Checking': 'Sinusuri',
    "By continuing, you agree to Para's": 'Sa pagpapatuloy, sumasang-ayon ka sa',
    'An email needs an @, like juan@gmail.com.': 'Kailangan ng @ ang email, gaya ng juan@gmail.com.',
    'Enter a valid email address, like juan@gmail.com.': 'Maglagay ng tamang email address, gaya ng juan@gmail.com.',
    'Checking this email…': 'Sinusuri ang email na ito…',
    'This email is registered to Para.': 'Naka-rehistro na sa Para ang email na ito.',
    'This email is registered to Para with Google.': 'Naka-rehistro sa Para ang email na ito gamit ang Google.',
    "New to Para? We'll create your account with this email.": 'Bago sa Para? Gagawan ka namin ng account gamit ang email na ito.',
    'How do you want to log in?': 'Paano mo gustong mag-log in?',
    'Send Code to Email': 'Ipadala ang Code sa Email',
    'Sending Code': 'Ipinapadala ang Code',
    'Code Sent': 'Naipadala ang Code',
    'Log In with Password': 'Mag-log In gamit ang Password',
    'Enter Your Password': 'Ilagay ang Iyong Password',
    'Log in with the password of your Para account.': 'Mag-log in gamit ang password ng iyong Para account.',
    'Forgot your password?': 'Nakalimutan ang password?',
    'Log in with a code instead': 'Mag-log in gamit ang code',
    'Incorrect password.': 'Mali ang password.',
    'Check Your Email': 'Tingnan ang Iyong Email',
    'Confirm Your Email': 'Kumpirmahin ang Iyong Email',
    'We sent a 6-digit code to': 'Nagpadala kami ng 6-digit na code sa',
    '. It expires in 10 minutes.': '. Mag-e-expire ito sa loob ng 10 minuto.',
    '6-digit code': '6-digit na code',
    'Checking Code': 'Sinusuri ang Code',
    "Didn't get it? Check your spam folder, or": 'Hindi natanggap? Tingnan ang spam folder, o',
    'resend the code': 'ipadala ulit ang code',
    'Use password instead': 'Gumamit ng password',
    'This account was made with Google. You can also go back and use Continue with Google.':
        'Ginawa ang account na ito gamit ang Google. Puwede ka ring bumalik at gamitin ang Google.',
    'Enter the 6-digit code from your email.': 'Ilagay ang 6-digit na code mula sa iyong email.',
    'This code has expired. Send a new one.': 'Nag-expire na ang code na ito. Magpadala ng bago.',
    'This code was already used. Send a new one.': 'Nagamit na ang code na ito. Magpadala ng bago.',
    'Too many wrong tries. Send a new code.': 'Masyadong maraming maling subok. Magpadala ng bagong code.',
    'Please wait a moment before asking for another code.': 'Maghintay sandali bago humingi ng panibagong code.',
    'Too many codes were sent. Please try again in an hour, or use your password or Google.':
        'Masyadong maraming code ang naipadala. Subukan ulit pagkalipas ng isang oras, o gamitin ang password o Google.',
    'Email codes are not available right now. Please log in with your password or Google.':
        'Hindi available ang email code ngayon. Mag-log in gamit ang password o Google.',
    'We could not send the email. Please try again in a moment.': 'Hindi namin naipadala ang email. Subukan ulit mamaya.',
    'This account has no password yet. Log in with a code sent to your email, or with Google.':
        'Wala pang password ang account na ito. Mag-log in gamit ang code na ipapadala sa email mo, o gamit ang Google.',
    'Too many tries. Please wait a few minutes and try again.': 'Masyadong maraming subok. Maghintay ng ilang minuto at subukan ulit.',
    'Welcome to Para! You can change your name in Account Settings.':
        'Maligayang pagdating sa Para! Puwede mong palitan ang pangalan mo sa Account Settings.',
    'You can always log in with a code sent to your email. A password is optional.':
        'Puwede kang laging mag-log in gamit ang code na ipapadala sa email mo. Opsyonal ang password.',
    'Not set': 'Wala pa',
    'Set Password': 'Itakda ang Password',
    'Set a Password': 'Magtakda ng Password',
    'New email address': 'Bagong email address',
    'Send Code': 'Ipadala ang Code',
    'Confirm Your New Email': 'Kumpirmahin ang Bagong Email',
    'New password (at least 8 characters)': 'Bagong password (hindi bababa sa 8 character)',
    'Your password was set. You can now log in with it or with a code.':
        'Naitakda na ang password mo. Puwede ka nang mag-log in gamit ito o gamit ang code.',
    'For your safety, please enter your current password.': 'Para sa iyong kaligtasan, ilagay ang kasalukuyang password.',
    'For your safety, log out and log in again before changing your email.':
        'Para sa iyong kaligtasan, mag-log out at mag-log in ulit bago palitan ang email.',
    'This email is already registered to Para.': 'Naka-rehistro na sa Para ang email na ito.',
    'This is already your email.': 'Ito na ang email mo.',
    'Email': 'Email',
    'Password': 'Password',
    'Show password': 'Ipakita ang password',
    'Hide password': 'Itago ang password',
    'Logging In': 'Nagla-log In',
    'Logged In': 'Naka-log In Na',
    'Name': 'Pangalan',
    'and': 'at',
    'Terms of Service': 'Mga Tuntunin ng Serbisyo',
    'Privacy Policy': 'Patakaran sa Privacy',
    'Create Account': 'Gumawa ng Account',
    'New password': 'Bagong password',
    'Logged out. See you soon!': 'Naka-log out ka na. Hanggang sa muli!',
    'Name is required.': 'Kailangan ang pangalan.',
    'Email is required.': 'Kailangan ang email.',
    'Enter a valid email address.': 'Maglagay ng tamang email address.',
    'Password is required.': 'Kailangan ang password.',
    'Password must be at least 8 characters.': 'Dapat hindi bababa sa 8 character ang password.',
    'Passwords do not match.': 'Hindi magkatugma ang mga password.',

    // ---- Calculate: panel ----
    'Trip planner': 'Planuhin ang biyahe',
    'Panel sections': 'Mga bahagi ng panel',
    'Trip': 'Biyahe',
    'Saved': 'Naka-save',
    'Hide panel': 'Itago ang panel',
    'Show the trip panel': 'Ipakita ang panel ng biyahe',
    'Show or hide the trip panel': 'Ipakita o itago ang panel ng biyahe',
    'Where to Today?': 'Saan Tayo Ngayon?',
    'Search two places in SJDM to see the route and fare.': 'Maghanap ng dalawang lugar sa SJDM para makita ang ruta at pamasahe.',
    'From: Search a place': 'Mula: Maghanap ng lugar',
    'To: Search a place': 'Papunta: Maghanap ng lugar',
    'Origin location': 'Pinanggalingan',
    'Destination location': 'Pupuntahan',
    'Swap origin and destination': 'Pagpalitin ang pinanggalingan at pupuntahan',
    'Vehicle': 'Sasakyan',
    'Transportation': 'Sasakyan',
    'Transportation type': 'Uri ng sasakyan',
    'Passenger': 'Pasahero',
    'Passenger type': 'Uri ng pasahero',
    'Regular': 'Regular',
    'Student': 'Estudyante',
    'Senior Citizen': 'Senior Citizen',
    'Student (20% off)': 'Estudyante (20% bawas)',
    'Senior Citizen (20% off)': 'Senior Citizen (20% bawas)',
    'PWD (20% off)': 'PWD (20% bawas)',
    'Route': 'Ruta',
    'Your fare': 'Pamasahe mo',
    'Fare calculation result': 'Resulta ng pagkuwenta ng pamasahe',
    'See fare breakdown': 'Tingnan ang detalye ng pamasahe',
    'Base fare': 'Base fare',
    'Excess fare': 'Dagdag na pamasahe',
    'Discount': 'Diskwento',
    'Exact fare (before rounding)': 'Eksaktong pamasahe (bago ibilog)',
    'None': 'Wala',
    'Total fare': 'Kabuuang pamasahe',
    'Distance follows the road route on the map and travel time uses an average speed, so the actual fare and time may vary a little.':
        'Ang layo ay batay sa ruta sa kalsada at ang oras ay batay sa karaniwang bilis, kaya puwedeng medyo mag-iba ang aktwal na pamasahe at oras.',
    'Save as favorite': 'I-save bilang paborito',
    'Pick where you\'re going, and I\'ll work out your fare!': 'Piliin kung saan ka pupunta, at kukuwentahin ko ang pamasahe mo!',
    'Select an origin and destination to see the fare!': 'Pumili ng pinanggalingan at pupuntahan para makita ang pamasahe!',
    'Now choose a transport type and passenger type!': 'Ngayon, pumili ng uri ng sasakyan at pasahero!',
    'Interactive SJDM map. Right-click to save a landmark.': 'Interactive na mapa ng SJDM. I-right-click para mag-save ng landmark.',

    // ---- Calculate: search ----
    'Saved Landmarks': 'Mga Naka-save na Landmark',
    'Places in SJDM': 'Mga Lugar sa SJDM',
    'Place in SJDM': 'Lugar sa SJDM',
    'Public landmark': 'Pampublikong landmark',
    'Your landmark': 'Landmark mo',
    'Personal landmark': 'Personal na landmark',
    'Recent': 'Kamakailan',
    'Use My Current Location': 'Gamitin ang Kasalukuyang Lokasyon Ko',
    'Uses your phone or browser location': 'Gagamitin ang lokasyon ng phone o browser mo',
    'My Location': 'Lokasyon Ko',
    'Finding you...': 'Hinahanap ka...',
    'Keep typing to search places in SJDM.': 'Ituloy ang pag-type para maghanap ng lugar sa SJDM.',
    'No matching places found. Try another name or a nearby landmark.': 'Walang nakitang lugar. Subukan ang ibang pangalan o malapit na landmark.',
    'Could not load search results. Please try again.': 'Hindi ma-load ang mga resulta. Pakisubukan ulit.',
    'Location is turned off. Allow it in your browser, or search for a place.': 'Naka-off ang lokasyon. Payagan ito sa browser mo, o maghanap ng lugar.',
    'You seem to be outside SJDM. Search for a place instead.': 'Mukhang nasa labas ka ng SJDM. Maghanap na lang ng lugar.',
    'Your browser cannot share your location.': 'Hindi maibahagi ng browser mo ang lokasyon mo.',
    'Origin and destination cannot be the same location.': 'Hindi puwedeng iisang lugar ang pinanggalingan at pupuntahan.',

    // ---- Calculate: results, map, notes ----
    'Road route unavailable. Showing a direct line and estimating the distance.': 'Hindi makuha ang ruta sa kalsada. Tuwid na linya muna ang ipinapakita at tinatantiya ang layo.',
    'Could not calculate the fare.': 'Hindi makuwenta ang pamasahe.',
    'Long trip: You may need to transfer to another jeepney or bus on the way.': 'Mahabang biyahe: Baka kailangan mong lumipat ng ibang jeep o bus sa daan.',
    'Trip loaded. The fare was recalculated with current rates.': 'Na-load ang biyahe. Kinuwenta ulit ang pamasahe gamit ang kasalukuyang singil.',
    'Could not restore the selected route.': 'Hindi maibalik ang napiling ruta.',

    // ---- Calculate: saved tab ----
    'Favorites': 'Mga Paborito',
    'Favourites': 'Mga Paborito',
    'Recent Trips': 'Mga Huling Biyahe',
    'Landmarks': 'Mga Landmark',
    'Tap a favorite to load it.': 'I-tap ang paborito para i-load ito.',
    'Tap a trip to run it again.': 'I-tap ang biyahe para ulitin ito.',
    'Right-click the map to save a new landmark.': 'I-right-click ang mapa para mag-save ng bagong landmark.',
    'Search landmarks': 'Maghanap ng landmark',
    'Export JSON': 'I-export ang JSON',
    'Clear All': 'Burahin Lahat',
    'Clear trip history?': 'Burahin ang kasaysayan ng biyahe?',
    'All of your saved trips will be removed.': 'Mabubura ang lahat ng naka-save mong biyahe.',
    'Trip history cleared.': 'Nabura na ang kasaysayan ng biyahe.',
    'Trip history exported as para-trips.json.': 'Na-export ang kasaysayan ng biyahe bilang para-trips.json.',
    'No trips to export yet.': 'Wala pang biyaheng mai-export.',
    'Trip removed.': 'Naalis ang biyahe.',
    'Could not update Recent Trips. Please try again.': 'Hindi ma-update ang Mga Huling Biyahe. Pakisubukan ulit.',
    'No public landmarks yet.': 'Wala pang pampublikong landmark.',
    'Public · ': 'Pampubliko · ',
    'Save Favorite Route': 'I-save ang Paboritong Ruta',
    'e.g. Home to School': 'hal. Bahay papuntang Eskwela',
    'Added to your favorites!': 'Naidagdag sa mga paborito mo!',
    'Favorite removed.': 'Naalis ang paborito.',
    'Log in to save favorite routes.': 'Mag-log in para mag-save ng paboritong ruta.',
    'Add a Landmark': 'Magdagdag ng Landmark',
    'Add Landmark': 'Idagdag ang Landmark',
    'Landmark name': 'Pangalan ng landmark',
    'e.g. SM City SJDM': 'hal. SM City SJDM',
    'Category': 'Kategorya',
    'Description': 'Paglalarawan',
    'Brief description of this place': 'Maikling paglalarawan ng lugar na ito',
    'Public landmark (visible to everyone)': 'Pampublikong landmark (makikita ng lahat)',
    'Save Landmark': 'I-save ang Landmark',
    'Landmark Details': 'Detalye ng Landmark',
    'Edit Landmark': 'I-edit ang Landmark',
    'Edit landmark': 'I-edit ang landmark',
    'Delete landmark?': 'Burahin ang landmark?',
    'Remove this landmark?': 'Alisin ang landmark na ito?',
    'Landmark removed.': 'Naalis ang landmark.',
    'Landmark updated.': 'Na-update ang landmark.',
    'Landmark name is required.': 'Kailangan ang pangalan ng landmark.',
    'Please enter a landmark name.': 'Pakilagay ang pangalan ng landmark.',
    'Log in first to save landmarks.': 'Mag-log in muna para mag-save ng landmark.',
    'You can only add landmarks within San Jose del Monte.': 'Sa loob lang ng San Jose del Monte puwedeng magdagdag ng landmark.',
    'Other': 'Iba pa',
    'School': 'Paaralan',
    'Church': 'Simbahan',
    'Hospital': 'Ospital',
    'Market': 'Palengke',
    'Food': 'Kainan',
    'Park': 'Parke',
    'Terminal': 'Terminal',
    'Label is required.': 'Kailangan ang label.',
    'No favorites yet.': 'Wala pang paborito.',
    'Calculate a fare, then press the star.': 'Magkuwenta ng pamasahe, saka pindutin ang star.',
    'No recent trips yet.': 'Wala pang huling biyahe.',
    'Calculate a fare while logged in to build your history.': 'Magkuwenta ng pamasahe habang naka-log in para mabuo ang kasaysayan mo.',
    'No landmarks yet.': 'Wala pang landmark.',
    'Right-click the map to add one!': 'I-right-click ang mapa para magdagdag!',
    // "Please [log in] to see your favorite routes." is three pieces around a link
    'Please': '',
    'log in': 'Mag-log in',
    'to see your favorite routes.': 'para makita ang mga paborito mong ruta.',
    'to see your recent trips.': 'para makita ang mga huli mong biyahe.',
    'Showing public landmarks.': 'Ipinapakita ang mga pampublikong landmark.',
    'to save your own.': 'para mag-save ng sarili mo.',
    'Saved items': 'Mga naka-save',
    // Landmark dialogs
    'Name:': 'Pangalan:',
    'Label:': 'Label:',
    'Category:': 'Kategorya:',
    'Short Description:': 'Maikling Paglalarawan:',
    'Landmark Name:': 'Pangalan ng Landmark:',
    'Enter new Name:': 'Bagong pangalan:',
    'Select new Category:': 'Bagong kategorya:',
    'Enter new Short Description:': 'Bagong maikling paglalarawan:',
    // Map controls (MapLibre)
    'Map': 'Mapa',
    'Map marker': 'Marker sa mapa',
    'Zoom in': 'Palakihin',
    'Zoom out': 'Paliitin',
    'Toggle attribution': 'Ipakita ang pinagmulan ng mapa',
    'Data from': 'Datos mula sa',

    // ---- Profile menu, saved items ----
    'Welcome to Para': 'Maligayang pagdating sa Para',
    'You are browsing as a guest. Create an account to save trips, favorites and landmarks.':
        'Nagba-browse ka bilang guest. Gumawa ng account para ma-save ang mga biyahe, paborito at landmark.',
    'Your landmarks': 'Mga landmark mo',
    'Your favourite routes': 'Mga paborito mong ruta',
    'Your recent trips': 'Mga huli mong biyahe',
    'Nothing saved here yet.': 'Wala pang naka-save dito.',
    'No additional details': 'Walang dagdag na detalye',
    'Use Route': 'Gamitin ang Ruta',
    'Admin managed': 'Hawak ng admin',
    'Saved item': 'Naka-save na item',
    'Saved item removed.': 'Naalis ang naka-save na item.',
    'Item removed.': 'Naalis ang item.',
    'Remove saved item?': 'Alisin ang naka-save na item?',
    'Remove this item?': 'Alisin ang item na ito?',
    'This saved item will be removed from your account.': 'Aalisin ang item na ito sa account mo.',
    'Log Out of Para?': 'Mag-log out sa Para?',
    'Log out?': 'Mag-log out?',
    'You will need to log in again to see your trips, favorites and landmarks.': 'Kailangan mong mag-log in ulit para makita ang mga biyahe, paborito at landmark mo.',
    'You will need to sign in again to manage your saved trips, favorites, and landmarks.': 'Kailangan mong mag-sign in ulit para ma-manage ang mga naka-save mong biyahe, paborito at landmark.',
    'Stay Signed In': 'Manatiling Naka-sign In',

    // ---- Account settings ----
    'Settings sections': 'Mga bahagi ng settings',
    'Change profile picture': 'Palitan ang profile picture',
    'Profile picture': 'Profile picture',
    'Profile': 'Profile',
    'Security': 'Seguridad',
    'Preferences': 'Mga Kagustuhan',
    'Activity': 'Aktibidad',
    'Personal Information': 'Personal na Impormasyon',
    'Update the details on your account.': 'I-update ang mga detalye ng account mo.',
    'Member since': 'Miyembro mula',
    'Not available': 'Hindi available',
    'Commute Preferences': 'Mga Kagustuhan sa Biyahe',
    'The fare calculator starts with these.': 'Ito ang unang gagamitin ng kalkulador ng pamasahe.',
    'Save Preferences': 'I-save ang Mga Kagustuhan',
    'Commute preferences saved.': 'Na-save ang mga kagustuhan sa biyahe.',
    'Your Activity': 'Ang Iyong Aktibidad',
    'What you have saved in Para.': 'Mga na-save mo sa Para.',
    'Trips': 'Mga Biyahe',
    'Edit Name': 'I-edit ang Pangalan',
    'Display name': 'Pangalang ipapakita',
    'Save Changes': 'I-save ang mga Pagbabago',
    'Change Email': 'Palitan ang Email',
    'Email address': 'Email address',
    'Change Password': 'Palitan ang Password',
    'Current password': 'Kasalukuyang password',
    'Confirm new password': 'Kumpirmahin ang bagong password',
    'New password must be at least 8 characters.': 'Dapat hindi bababa sa 8 character ang bagong password.',
    'Your name was updated.': 'Na-update ang pangalan mo.',
    'Your email was updated.': 'Na-update ang email mo.',
    'Your password was changed.': 'Napalitan na ang password mo.',
    'Profile picture updated.': 'Na-update ang profile picture.',
    'Profile pictures must be 2 MB or smaller.': 'Dapat 2 MB o mas maliit ang profile picture.',

    // ---- Messages from the server (api/*.php) ----
    'Please log in first.': 'Mag-log in muna.',
    'Invalid email or password.': 'Mali ang email o password.',
    'Email already registered.': 'Nakarehistro na ang email na ito.',
    'This email address is already registered.': 'Nakarehistro na ang email address na ito.',
    'Please fix the highlighted fields.': 'Pakiayos ang mga naka-highlight na field.',
    'Please fill in all fields.': 'Pakipunan ang lahat ng field.',
    'Something went wrong on the server. Please try again.': 'May problema sa server. Pakisubukan ulit.',
    'Something went wrong.': 'May nagkaproblema.',
    'Unexpected server response.': 'Hindi inaasahang sagot mula sa server.',
    'Invalid or missing security token. Refresh the page and try again.': 'Mali o walang security token. I-refresh ang page at subukan ulit.',
    'Google sign-in failed. Please try again.': 'Hindi gumana ang Google sign-in. Pakisubukan ulit.',
    'This email is already linked to a different Google account.': 'Naka-link na ang email na ito sa ibang Google account.',
    'Administrators sign in on the admin sign-in page.': 'Sa admin sign-in page nagsa-sign in ang mga administrator.',
    'This route is already in your favorites.': 'Nasa mga paborito mo na ang rutang ito.',
    'Please select both commute preferences.': 'Pakipili ang parehong kagustuhan sa biyahe.',
    'Use a JPG, PNG, or WebP image.': 'Gumamit ng larawang JPG, PNG o WebP.',
    'The uploaded file is not a supported image.': 'Hindi suportadong larawan ang na-upload na file.',
    'Invalid transport or passenger type.': 'Maling uri ng sasakyan o pasahero.',
    'The selected passenger type is invalid or inactive.': 'Mali o hindi aktibo ang napiling uri ng pasahero.',
    'The selected transportation type is invalid or inactive.': 'Mali o hindi aktibo ang napiling uri ng sasakyan.',
    'Cannot reach the server. Check your connection and that Apache/MySQL are running.': 'Hindi maabot ang server. Tingnan ang koneksyon mo.'
};

// Texts with numbers or names inside: [pattern, Filipino version]
const FIL_PATTERNS = [
    [/^Your stop is only about (\d+) m away, about (\d+) min on foot\. Walking may be easier than riding\.$/,
        'Mga $1 m lang ang layo ng hintuan mo, mga $2 min kung lalakarin. Mas madali sigurong maglakad kaysa sumakay.'],
    [/^We sent a 6-digit code to (.+)\.$/, 'Nagpadala kami ng 6-digit na code sa $1.'],
    [/^Enter the 6-digit code sent to (.+)$/, 'Ilagay ang 6-digit na code na ipinadala sa $1'],
    [/^resend the code in (\d+)s$/, 'ipadala ulit ang code sa loob ng $1s'],
    [/^Incorrect code\. (\d+) tries left\.$/, 'Mali ang code. $1 subok na lang ang natitira.'],
    [/^([\d.]+) km by road$/, '$1 km sa kalsada'],
    [/^([\d.]+) km \(straight line\)$/, '$1 km (tuwid na linya)'],
    [/^~(\d+) min \(arrive ~(.+)\)$/, '~$1 min (darating ~$2)'],
    [/^-₱([\d.]+) \((\d+)% off\)$/, '-₱$1 ($2% bawas)'],
    [/^Route (\d+) · (.+)$/, 'Ruta $1 · $2'],
    [/^Welcome back, (.+)!$/, 'Maligayang pagbabalik, $1!'],
    [/^Welcome to Para, (.+)!$/, 'Maligayang pagdating sa Para, $1!'],
    [/^Welcome, (.+)!$/, 'Maligayang pagdating, $1!'],
    [/^Good Morning, (.+)!$/, 'Magandang Umaga, $1!'],
    [/^Good Afternoon, (.+)!$/, 'Magandang Hapon, $1!'],
    [/^Good Evening, (.+)!$/, 'Magandang Gabi, $1!'],
    // Navbar date "Monday, Nov 2 2026" -> "Lunes, Nob 2 2026"
    [/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) (\d{4})$/,
        (_, day, month, date, year) => ({ Sunday: 'Linggo', Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miyerkules',
            Thursday: 'Huwebes', Friday: 'Biyernes', Saturday: 'Sabado' })[day] + ', ' +
            ({ Jan: 'Ene', Feb: 'Peb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Hun', Jul: 'Hul', Aug: 'Ago',
               Sep: 'Set', Oct: 'Okt', Nov: 'Nob', Dec: 'Dis' })[month] + ` ${date} ${year}`],
    [/^Public landmark · (.+)$/, 'Pampublikong landmark · $1'],
    [/^Your landmark · (.+)$/, 'Landmark mo · $1'],
    [/^Personal landmark · (.+)$/, 'Personal na landmark · $1'],
    [/^Public · (.+)$/, 'Pampubliko · $1'],
    [/^No saved (.+) yet\.$/, 'Wala pang naka-save na $1.'],
    [/^Too many failed attempts\. Please try again in (\d+) minutes\.$/, 'Masyadong maraming maling subok. Subukan ulit pagkalipas ng $1 minuto.'],
    [/^Jeepneys and buses can't reach your stop\. It's about (\d+) m from the nearest main road, so ride a tricycle \(special trip\) for the last part\.$/,
        'Hindi naaabot ng jeep at bus ang hintuan mo. Mga $1 m ito mula sa pinakamalapit na pangunahing kalsada, kaya mag-tricycle (special trip) sa huling bahagi.'],
    [/^Your stop isn't on a jeepney or bus road\. Get off at the nearest main road and walk about (\d+) min\.$/,
        'Wala sa daanan ng jeep o bus ang hintuan mo. Bumaba sa pinakamalapit na pangunahing kalsada at maglakad nang mga $1 min.'],
    [/^Jeepneys and buses don't pass your starting point\. It's about (\d+) m from the nearest main road, so ride a tricycle \(special trip\) to get there first\.$/,
        'Hindi dumadaan ang jeep at bus sa pinanggalingan mo. Mga $1 m ito mula sa pinakamalapit na pangunahing kalsada, kaya mag-tricycle (special trip) muna papunta roon.'],
    [/^Your starting point isn't on a jeepney or bus road\. Walk about (\d+) min to the nearest main road to get a ride\.$/,
        'Wala sa daanan ng jeep o bus ang pinanggalingan mo. Maglakad nang mga $1 min papunta sa pinakamalapit na pangunahing kalsada para makasakay.'],
    [/^Could not calculate the fare\. (.+)$/, 'Hindi makuwenta ang pamasahe. $1']
];

// ---- The machinery (no need to edit below to add a translation) ----
let paraLang = 'en';
try { if (localStorage.getItem('para_lang') === 'fil') paraLang = 'fil'; } catch (e) { /* storage blocked: English */ }

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'TITLE', 'SVG', 'svg']);   // the tab title has its own function
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
const i18nEnglish = new WeakMap();   // text node or element -> its English text / { attribute: English }
const i18nShown = new WeakMap();     // text node -> what we put there (to notice when a script changes it)

// The Filipino version of an English text, or null when it is not in the lists.
function toFilipino(english) {
    const key = english.replace(/\s+/g, ' ').trim();
    if (!key) return null;
    let out = FIL[key];
    if (out === undefined) {
        const rule = FIL_PATTERNS.find(([re]) => re.test(key));
        if (rule) out = key.replace(rule[0], rule[1]);
    }
    if (out === undefined) return null;
    // keep the spaces around the text (e.g. "New to Para? " before a link)
    return english.match(/^\s*/)[0] + out + english.match(/\s*$/)[0];
}

// Shows one piece of text in the chosen language (remembering its English).
function translateTextNode(node) {
    const parent = node.parentNode;
    if (!parent || !parent.closest || SKIP_TAGS.has(parent.nodeName) || parent.closest('[translate="no"]')) return;
    // A script changed this text since we last touched it: that is the new English
    if (!i18nEnglish.has(node) || node.nodeValue !== i18nShown.get(node)) i18nEnglish.set(node, node.nodeValue);
    const english = i18nEnglish.get(node);
    const shown = paraLang === 'fil' ? (toFilipino(english) ?? english) : english;
    i18nShown.set(node, shown);
    if (node.nodeValue !== shown) node.nodeValue = shown;
}

// Same for the placeholder, tooltip and screen-reader label of an element.
function translateAttributes(el) {
    let saved = i18nEnglish.get(el);
    for (const attr of I18N_ATTRS) {
        if (!el.hasAttribute(attr)) continue;
        const value = el.getAttribute(attr);
        if (!saved) { saved = { shown: {} }; i18nEnglish.set(el, saved); }
        if (saved[attr] === undefined || value !== saved.shown[attr]) saved[attr] = value;
        const shown = paraLang === 'fil' ? (toFilipino(saved[attr]) ?? saved[attr]) : saved[attr];
        saved.shown[attr] = shown;
        if (value !== shown) el.setAttribute(attr, shown);
    }
}

// Translates an element and everything inside it.
function translateTree(root) {
    if (root.nodeType === 3) return translateTextNode(root);
    if (root.nodeType !== 1 || SKIP_TAGS.has(root.nodeName)) return;
    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.nodeType === 1 && SKIP_TAGS.has(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeType === 3) translateTextNode(n);
        else translateAttributes(n);
    }
}

// The English text of an element, even while Filipino is shown (ui.js builds the chips from it)
function englishOf(el) {
    let text = '';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) text += i18nEnglish.has(n) ? i18nEnglish.get(n) : n.nodeValue;
    return text;
}

let englishTitle = null;
// Translates the browser tab title.
function translateTitle() {
    if (englishTitle === null || (document.title !== englishTitle && document.title !== toFilipino(englishTitle))) englishTitle = document.title;
    const wanted = paraLang === 'fil' ? (toFilipino(englishTitle) ?? englishTitle) : englishTitle;
    if (document.title !== wanted) document.title = wanted;   // setting it, even to the same text, counts as a change
}

// Puts the whole page in the chosen language and updates the EN / FIL button.
function applyLanguage() {
    document.documentElement.lang = paraLang === 'fil' ? 'fil' : 'en';
    if (document.body) translateTree(document.body);
    translateTitle();
    document.querySelectorAll('.lang-toggle').forEach(btn => {
        btn.querySelector('.lang-code').textContent = paraLang === 'fil' ? 'FIL' : 'EN';
        btn.setAttribute('aria-label', paraLang === 'fil' ? 'Wika: Filipino. Palitan sa English' : 'Language: English. Switch to Filipino');
    });
}

// Switches language and remembers the choice.
function setLanguage(lang) {
    paraLang = lang === 'fil' ? 'fil' : 'en';
    try { localStorage.setItem('para_lang', paraLang); } catch (e) { /* not remembered, still switches now */ }
    applyLanguage();
}

// Translate everything that is added or changed from now on (also while the page is still loading)
new MutationObserver(records => {
    if (paraLang === 'en') return;
    for (const r of records) {
        if (r.type === 'childList') r.addedNodes.forEach(translateTree);
        else if (r.type === 'characterData') translateTextNode(r.target);
        else if (r.type === 'attributes' && r.target.nodeType === 1) translateAttributes(r.target);
    }
    if (document.title) translateTitle();
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });

// EN / FIL button beside the dark mode button
document.addEventListener('DOMContentLoaded', () => {
    const dark = document.getElementById('dark-toggle');
    if (dark && !document.querySelector('.lang-toggle')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lang-toggle';
        btn.setAttribute('translate', 'no');
        btn.title = 'English / Filipino';
        btn.innerHTML = '<i data-lucide="languages" aria-hidden="true"></i><span class="lang-code">EN</span>';
        btn.addEventListener('click', () => setLanguage(paraLang === 'fil' ? 'en' : 'fil'));
        dark.parentNode.insertBefore(btn, dark);
    }
    applyLanguage();
});
