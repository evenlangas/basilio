# 🌿 Basilio - Digital Family Cookbook

A simple, intuitive digital cookbook app built with Next.js that helps families organize recipes, manage shopping lists, and cook together.

![Basilio App](https://img.shields.io/badge/Made%20with-Next.js-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### 📖 Recipe Management
- **Create & Edit Recipes**: Add detailed recipes with ingredients, instructions, and photos
- **Image Upload**: Beautiful recipe photos with automatic optimization
- **Recipe Organization**: Tag and categorize your favorite dishes
- **Family Sharing**: Share recipes with all family members

### 🛒 Smart Shopping Lists
- **One Shared List**: Single shopping list per family
- **Recipe Integration**: Add recipe ingredients directly to shopping list
- **Smart Quantities**: Automatically combines similar ingredients (e.g., 100g + 50g = 150g)
- **Real-time Updates**: Everyone sees the same list instantly

### 👨‍👩‍👧‍👦 Family Features
- **Create or Join Families**: Easy invite code system
- **Automatic Migration**: Personal recipes and lists merge when joining families
- **Shared Everything**: All family members can edit recipes and shopping lists
- **Family Management**: Edit family name and manage members

### 📱 Mobile Optimized
- **Responsive Design**: Perfect on phones, tablets, and desktop
- **Touch-friendly**: Large buttons and easy navigation
- **Mobile-first**: Designed for cooking in the kitchen

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (free)
- Google Cloud account (for OAuth)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/basilio.git
   cd basilio
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your MongoDB URI, Google OAuth credentials, and NextAuth secret.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🌐 Deploy for Free

Deploy your Basilio app completely free using Vercel and MongoDB Atlas. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Free hosting includes**:
- Frontend hosting (Vercel)
- Database (MongoDB Atlas)
- File storage (Vercel Blob)
- Authentication (NextAuth.js)
- Automatic deployments

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **File Upload**: Vercel Blob storage
- **Image Processing**: Sharp for optimization
- **Deployment**: Vercel (serverless)

## 📱 Screenshots

### Recipe Management
- Clean, mobile-friendly recipe cards
- Beautiful photo uploads with automatic optimization
- Easy ingredient and instruction editing

### Shopping Lists
- Shared family shopping lists
- Smart ingredient combining
- One-tap recipe-to-list adding

### Family Sharing
- Simple invite code system
- Automatic data migration
- Seamless collaboration

## 🔧 Key Features Explained

### Smart Ingredient Combining
When adding recipes to shopping lists, Basilio intelligently combines similar ingredients:
- `100g cheese` + `50g cheese` = `150g cheese`
- Handles different units: `500ml milk` + `0.5l milk` = `1l milk`
- Recognizes variations: `onion` + `yellow onion` = combined

### Family-First Design
- **No Personal Items**: When in a family, everything is shared
- **One Shopping List**: Each family has exactly one shared shopping list
- **Easy Migration**: Personal recipes automatically become family recipes when joining

### Mobile Optimization
- Responsive grid layouts
- Touch-friendly buttons and forms
- Optimized text sizes and spacing
- Perfect for kitchen use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

Having issues? Check out the [DEPLOYMENT.md](./DEPLOYMENT.md) guide or open an issue on GitHub.

---

**Built with ❤️ for families who love to cook together** 🍳👨‍👩‍👧‍👦