import { User } from './types';

// Curated high quality portrait avatars for realistic profile representation
const AVATAR_URLS = [
  '/pics/pic_01.jpg',
  '/pics/pic_02.png',
  '/pics/pic_03.jpg',
  '/pics/pic_04.jpg',
  '/pics/pic_05.jpg',
  '/pics/pic_06.png',
  '/pics/pic_07.jpg',
  '/pics/pic_08.jpg',
  '/pics/pic_09.png',
  '/pics/pic_10.png',
  '/pics/pic_14.png',
  '/pics/pic_16.jpg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
];

const COVER_URLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
];

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'Jackson', 'Ava', 'Aiden', 'Isabella', 'Lucas',
  'Mia', 'Oliver', 'Harper', 'Ethan', 'Evelyn', 'Alexander', 'Abigail', 'Henry', 'Emily', 'Sebastian',
  'Charlotte', 'Jack', 'Amelia', 'Owen', 'Ella', 'Theodore', 'Elizabeth', 'Levi', 'Camila', 'Julian',
  'Luna', 'Mateo', 'Sofia', 'Daniel', 'Avery', 'Samuel', 'Mila', 'David', 'Aria', 'Joseph',
  'Scarlett', 'Carter', 'Penelope', 'Wyatt', 'Layla', 'John', 'Chloe', 'Luke', 'Victoria', 'Asher',
  'Madison', 'Leo', 'Eleanor', 'Gabriel', 'Grace', 'Anthony', 'Nora', 'Isaac', 'Riley', 'Dylan',
  'Zoey', 'Lincoln', 'Stella', 'Thomas', 'Hazel', 'Maverick', 'Aurora', 'Josiah', 'Natalie', 'Elias',
  'Emilia', 'Charles', 'Violet', 'Caleb', 'Hannah', 'Christopher', 'Brooklyn', 'Ezekiel', 'Leah', 'Miles',
  'Audrey', 'Jaxon', 'Savannah', 'Isaiah', 'Claire', 'Andrew', 'Skylar', 'Joshua', 'Bella', 'Nathan',
  'Paisley', 'Nolan', 'Genesis', 'Adrian', 'Sophie', 'Cameron', 'Serenity', 'Hunter', 'Ellie', 'Austin',
  'Maya', 'Kai', 'Elena', 'Zara', 'Marcus', 'Devon', 'Kira', 'Felix', 'Sora', 'Dante',
  'Nina', 'Amara', 'Kenji', 'Talia', 'Soren', 'Freya', 'Gwen', 'Ezra', 'Rowan', 'Silas'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const BIOS = [
  'Visual storyteller & street photographer 📸 Exploring hidden alleys & neon nights.',
  'Digital creator, filmmaker & traveler ✈️ Chasing golden hour across the globe.',
  'Architecture & modern design enthusiast 🏙️ Minimalist aesthetics on MediaGram.',
  'Lifestyle, coffee & slow mornings in Brooklyn ☕✨ Capturing authentic memories.',
  'Cyberpunk vibes, 3D animation & synthwave moods ⚡ High bitrate 4K video enthusiast.',
  'Surfer, outdoor adventurer & ocean conservationist 🌊 Waves and good vibes.',
  'Fashion stylist & editorial photographer 👗 Styling concepts from Milan to Tokyo.',
  'Sound designer, music producer & vinyl collector 🎧 Beats, bass, and visual audio.',
  'Foodie & pastry chef documenting culinary journeys around Europe 🥐🍷',
  'Portrait artist working with anamorphic lenses and dynamic natural light 📷',
  'Nature & alpine explorer 🏔️ Camping under starfields and misty summits.',
  'Documenting urban culture, graffiti & skate life in Los Angeles 🛹',
  'Software architect building the next generation of creative media tools 💻',
  'Analog film lover, 35mm & 120 format addict 🎞️ Grain is beautiful.',
  'Fitness coach, marathon runner & mindful living advocate 🏃‍♂️ Health is wealth.'
];

const NICHES = [
  'captures', 'visuals', 'photos', 'lens', 'cinema', 'shots', 'pixels', 'vibe',
  'travels', 'studio', 'frames', 'design', 'art', 'light', 'wander', 'daily',
  'life', 'creative', 'journal', 'moments', 'films', 'space', 'craft', 'flow'
];

const INTEREST_TAG_POOLS = [
  ['photography', 'travel', 'cinematics'],
  ['streetphotography', 'tokyo', 'neon'],
  ['design', 'minimalism', 'architecture'],
  ['coffee', 'lifestyle', 'morning'],
  ['cyberpunk', 'synthwave', 'video'],
  ['surf', 'ocean', 'nature'],
  ['fashion', 'editorial', 'vintage'],
  ['music', 'audio', 'sound'],
  ['culinary', 'foodie', 'paris'],
  ['portraits', 'lighting', 'film']
];

export const UNIVERSAL_PASSWORD = 'password123';

let cachedUsers: User[] | null = null;

// Generate 1,050 rich, realistic, diverse user accounts (memoized singleton)
export function generateUsers(): User[] {
  if (cachedUsers) return cachedUsers;
  const users: User[] = [];

  // 1. Featured Top Creator: Alex (Customer Account)
  users.push({
    id: 'usr_customer',
    username: 'customer',
    email: 'customer@mediagram.app',
    password: UNIVERSAL_PASSWORD,
    name: 'Alex Rivera',
    bio: 'MediaGram Customer Account 📸 | Visual storyteller exploring reels, travel & cyberpunk photography with Cloudinary media delivery.',
    website: 'https://mediagram.app/customer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&h=400&fit=crop',
    role: 'USER',
    isVerified: true,
    status: 'active',
    followersCount: 14200,
    followingCount: 420,
    postsCount: 18,
    interestTags: ['photography', 'cyberpunk', 'travel'],
    settings: {
      isPrivateAccount: false,
      showActivityStatus: true,
      allowTaggingFrom: 'everyone',
      pauseNotifications: false,
      likesNotifications: true,
      commentsNotifications: true,
      messagesNotifications: true,
      cloudinaryAutoCompress: true,
      highQualityUploads: true,
    },
    createdAt: '2026-01-15T00:00:00.000Z',
  });

  // 2. Featured Creators
  const featured = [
    { username: 'sophia_visuals', name: 'Sophia Vance', bio: 'Editorial & high-fashion photographer based in Paris ✨ Vogue & Harper contributor.', avatar: AVATAR_URLS[0], followers: 84200 },
    { username: 'marcus_lens', name: 'Marcus Chen', bio: 'Architecture & modern street perspectives 🏙️ Sony Alpha ambassador.', avatar: AVATAR_URLS[1], followers: 62100 },
    { username: 'elena_captures', name: 'Elena Rostova', bio: 'Cinematic colorist & drone cinematographer 🚁 Capturing northern auroras.', avatar: AVATAR_URLS[2], followers: 91500 },
    { username: 'kai_cinema', name: 'Kai Tanaka', bio: 'Tokyo midnight videographer 🎥 Cyberpunk reels & anamorphic lenses.', avatar: AVATAR_URLS[3], followers: 48900 },
    { username: 'maya_style', name: 'Maya Brooks', bio: 'Clean aesthetic, warm minimalism, sustainable thrifted fashion 🌿', avatar: AVATAR_URLS[4], followers: 37400 },
    { username: 'zara_sound', name: 'Zara Al-Mansoor', bio: 'Sound designer & electronic music composer 🎧 Audio meets visual art.', avatar: AVATAR_URLS[5], followers: 29800 },
    { username: 'liam_wander', name: 'Liam Gallagher', bio: 'Wilderness trekker & mountaineer 🏔️ Chasing peaks in Patagonia & Alps.', avatar: AVATAR_URLS[6], followers: 53200 },
    { username: 'chloe_art', name: 'Chloe Dupont', bio: 'Digital illustrator & glassmorphism UI artist 🎨 Making pixels look tangible.', avatar: AVATAR_URLS[7], followers: 41200 },
    { username: 'noah_frames', name: 'Noah Sterling', bio: '35mm film photographer documenting intimate moments and golden light 🎞️', avatar: AVATAR_URLS[8], followers: 32600 },
  ];

  featured.forEach((f, idx) => {
    users.push({
      id: `usr_feat_${idx + 1}`,
      username: f.username,
      email: `${f.username}@mediagram.app`,
      password: UNIVERSAL_PASSWORD,
      name: f.name,
      bio: f.bio,
      website: `https://${f.username}.me`,
      avatarUrl: f.avatar,
      coverUrl: COVER_URLS[idx % COVER_URLS.length],
      role: 'CREATOR',
      isVerified: true,
      status: 'active',
      followersCount: f.followers,
      followingCount: Math.floor(200 + (idx * 37)),
      postsCount: Math.floor(24 + (idx * 5)),
      interestTags: INTEREST_TAG_POOLS[idx % INTEREST_TAG_POOLS.length],
      createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 10).toISOString(),
    });
  });

  // 3. Procedural Generation: 1,040 More Realistic Diverse Accounts
  const usedUsernames = new Set<string>(users.map(u => u.username));
  let count = 0;
  const targetCount = 1040;

  for (let fIdx = 0; fIdx < FIRST_NAMES.length; fIdx++) {
    for (let lIdx = 0; lIdx < LAST_NAMES.length; lIdx++) {
      if (count >= targetCount) break;

      const fName = FIRST_NAMES[fIdx];
      const lName = LAST_NAMES[lIdx];
      const niche = NICHES[(fIdx + lIdx) % NICHES.length];

      // Create realistic username variations
      let usernameCandidate = '';
      const style = (fIdx + lIdx) % 4;
      if (style === 0) {
        usernameCandidate = `${fName.toLowerCase()}.${lName.toLowerCase()}`;
      } else if (style === 1) {
        usernameCandidate = `${fName.toLowerCase()}_${niche}`;
      } else if (style === 2) {
        usernameCandidate = `${niche}.${lName.toLowerCase()}`;
      } else {
        usernameCandidate = `${fName.toLowerCase()}_${lName.toLowerCase()}`;
      }

      // If duplicate, append numeric identifier
      if (usedUsernames.has(usernameCandidate)) {
        usernameCandidate = `${usernameCandidate}${((fIdx * 7 + lIdx) % 99) + 1}`;
      }
      usedUsernames.add(usernameCandidate);

      const avatarIdx = (fIdx * 3 + lIdx * 7) % AVATAR_URLS.length;
      const coverIdx = (fIdx + lIdx) % COVER_URLS.length;
      const bioIdx = (fIdx * 5 + lIdx) % BIOS.length;
      const tagsIdx = (fIdx + lIdx) % INTEREST_TAG_POOLS.length;
      const isVerified = (count % 15 === 0); // ~7% verified
      const followers = Math.floor(120 + ((fIdx * 97 + lIdx * 113) % 48000));
      const following = Math.floor(45 + ((fIdx * 31 + lIdx * 17) % 1200));
      const postsCount = Math.floor(3 + ((fIdx * 7 + lIdx * 5) % 65));

      users.push({
        id: `usr_gen_${count + 1}`,
        username: usernameCandidate,
        email: `${usernameCandidate}@mediagram.app`,
        password: UNIVERSAL_PASSWORD,
        name: `${fName} ${lName}`,
        bio: BIOS[bioIdx],
        website: `https://${usernameCandidate}.mediagram.app`,
        avatarUrl: AVATAR_URLS[avatarIdx],
        coverUrl: COVER_URLS[coverIdx],
        role: isVerified ? 'CREATOR' : 'USER',
        isVerified,
        status: 'active',
        followersCount: followers,
        followingCount: following,
        postsCount,
        interestTags: INTEREST_TAG_POOLS[tagsIdx],
        createdAt: new Date(Date.now() - (count + 1) * 3600000 * 4).toISOString(),
      });

      count++;
    }
    if (count >= targetCount) break;
  }

  // 4. Dedicated Administrator (Strictly separated role: 'ADMIN')
  users.push({
    id: 'usr_admin',
    username: 'admin',
    email: 'admin@mediagram.app',
    password: UNIVERSAL_PASSWORD,
    name: 'Platform Administrator',
    bio: 'MediaGram Master Admin 🛡️ | Controls whole platform, media infrastructure, user accounts, Cloudinary storage & moderation.',
    website: 'https://mediagram.app/admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
    role: 'ADMIN',
    isVerified: true,
    status: 'active',
    followersCount: 99999,
    followingCount: 1,
    postsCount: 4,
    interestTags: ['infrastructure', 'cloudinary', 'security'],
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  cachedUsers = users;
  return users;
}
