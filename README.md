<p align="center">
  <img src="https://raw.githubusercontent.com/your-username/your-repo/main/public/logo.png" alt="ParkShift Logo" width="120" />
</p>

<h1 align="center">🚗 ParkShift</h1>
<p align="center">
  <b>Modern Parking Space Marketplace</b><br>
  <i>Find, book, and manage parking spaces with ease.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
</p>


---


## 📝 About ParkShift

**ParkShift** is a full-stack web application that connects drivers seeking parking with individuals or businesses offering available parking spaces. The platform provides a seamless experience for both renters and space owners, featuring secure authentication, real-time availability, integrated payments, and messaging. Whether you need a spot for a few hours or want to monetize your unused driveway, ParkShift makes parking simple, transparent, and efficient.

### Key Use Cases

- **Drivers:**  
  - Search for available parking spaces by location, date, and vehicle size.
  - View detailed listings with photos, amenities, and pricing.
  - Book and pay for parking securely online.
  - Communicate with space owners and receive instant notifications.
  - Leave reviews after your stay.

- **Space Owners:**  
  - List one or more parking spaces with custom availability and pricing.
  - Manage bookings and communicate with renters.
  - Receive payments directly to your account.
  - Track reviews and manage your listings from a single dashboard.


---


## 🎨 Color Scheme

| Color Name   | Hex       | Preview         |
|--------------|-----------|----------------|
| Primary      | #38BDF8   | ![#38BDF8](https://via.placeholder.com/20/38BDF8/000000?text=+) |
| Accent       | #0EA5E9   | ![#0EA5E9](https://via.placeholder.com/20/0EA5E9/000000?text=+) |
| Background   | #F8FAFC   | ![#F8FAFC](https://via.placeholder.com/20/F8FAFC/000000?text=+) |
| Surface      | #FFFFFF   | ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/000000?text=+) |
| Text         | #1E293B   | ![#1E293B](https://via.placeholder.com/20/1E293B/000000?text=+) |

---

## ✨ Features

- 🔒 **Authentication** with Supabase
- 🚗 **Parking Space Listings** & Booking
- 💳 **Payments** via Stripe
- 💬 **Messaging** between users
- ⭐ **Reviews** & Ratings
- 📱 **Responsive** UI with Tailwind CSS
- 🗺️ **Location-based Search** (PostGIS)
- 🛡️ **Row Level Security** for user data

---

## 📁 Project Structure

```
my-react-app
├── src
│   ├── components        # Reusable UI components
│   ├── pages             # Main page components
│   ├── styles            # Global styles
│   ├── App.js            # Main application component
│   └── index.js          # Entry point
├── public
│   └── logo.png          # App logo
│   └── index.html        # Main HTML file
├── supabase
│   └── schema.sql        # Database schema
├── package.json          # npm configuration
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/parkshift.git
cd parkshift/my-react-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment

- Copy `.env.example` to `.env` and fill in your Supabase/Stripe keys.

### 4. Start the development server

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🛠️ Supabase Setup

1. Create a new project at [Supabase](https://app.supabase.com/).
2. Paste the contents of `supabase/schema.sql` into the SQL editor and run.
3. Set up storage buckets and authentication as described in the [docs](./supabase/README.md).

---

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for improvements or new features.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <img src="https://raw.githubusercontent.com/your-username/your-repo/main/public/parking-illustration.svg" alt="Parking Illustration" width="300"/>
</p>