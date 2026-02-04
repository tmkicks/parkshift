<p align="center">
  <img src="https://raw.githubusercontent.com/thies-boese/parkshift/main/public/logos/logo-main.png" alt="ParkShift Logo" width="120" />
</p>

<h1 align="center">ParkShift</h1>
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

| Shade | Hex        | Preview |
|-------|------------|---------|
| 50    | `#f0fdf4`  | <img src="https://singlecolorimage.com/get/f0fdf4/20x20" alt="#f0fdf4" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 100   | `#dcfce7`  | <img src="https://singlecolorimage.com/get/dcfce7/20x20" alt="#dcfce7" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 200   | `#bbf7d0`  | <img src="https://singlecolorimage.com/get/bbf7d0/20x20" alt="#bbf7d0" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 300   | `#86efac`  | <img src="https://singlecolorimage.com/get/86efac/20x20" alt="#86efac" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 400   | `#4ade80`  | <img src="https://singlecolorimage.com/get/4ade80/20x20" alt="#4ade80" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 500   | `#22c55e`  | <img src="https://singlecolorimage.com/get/22c55e/20x20" alt="#22c55e" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 600   | `#16a34a`  | <img src="https://singlecolorimage.com/get/16a34a/20x20" alt="#16a34a" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 700   | `#15803d`  | <img src="https://singlecolorimage.com/get/15803d/20x20" alt="#15803d" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 800   | `#166534`  | <img src="https://singlecolorimage.com/get/166534/20x20" alt="#166534" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 900   | `#14532d`  | <img src="https://singlecolorimage.com/get/14532d/20x20" alt="#14532d" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |
| 950   | `#052e16`  | <img src="https://singlecolorimage.com/get/052e16/20x20" alt="#052e16" style="vertical-align:middle;border-radius:4px;border:1px solid #ccc;"/> |

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

## 👤 About the Author

<table>
  <tr>
    <td>
      <img src="https://avatars.githubusercontent.com/u/00000000?v=4" width="100" alt="Thies Boese Avatar" style="border-radius:50%;"/>
    </td>
    <td>
      <b>Thies Boese</b><br>
      <span>🎓 Finance Master's Applicant & International Business Bachelor</span><br>
      <span>🏫 <b>Maastricht University</b></span><br>
      <a href="mailto:thiesboese05@gmail.com">
        <img src="https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white" alt="Email"/>
      </a>
      <a href="https://www.linkedin.com/in/thies-boese-93851429a">
        <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
  </tr>
</table>

> Developed and maintained by Thies Boese as part of my academic and professional portfolio.<br>
> For networking, collaboration, or inquiries, please connect via the links above.

---

