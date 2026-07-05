import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.tsx';
import { WalletProvider } from './context/WalletContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Pages
import Home from './pages/Home.tsx';
import AllGames from './pages/AllGames.tsx';
import GameDetails from './pages/GameDetails.tsx';
import Categories from './pages/Categories.tsx';
import LiveTournament from './pages/LiveTournament.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import Rewards from './pages/Rewards.tsx';
import Wallet from './pages/Wallet.tsx';
import Profile from './pages/Profile.tsx';
import Achievements from './pages/Achievements.tsx';
import VIP from './pages/VIP.tsx';
import Offers from './pages/Offers.tsx';
import ReferEarn from './pages/ReferEarn.tsx';
import DailyRewards from './pages/DailyRewards.tsx';
import Support from './pages/Support.tsx';
import FAQ from './pages/FAQ.tsx';
import About from './pages/About.tsx';
import Contact from './pages/Contact.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsConditions from './pages/TermsConditions.tsx';
import NotFound from './pages/NotFound.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="games" element={<AllGames />} />
              <Route path="game/:id" element={<GameDetails />} />
              <Route path="categories" element={<Categories />} />
              <Route path="tournaments" element={<LiveTournament />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="rewards" element={<Rewards />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="wallet" element={<Wallet />} />
                <Route path="profile" element={<Profile />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="vip" element={<VIP />} />
                <Route path="offers" element={<Offers />} />
                <Route path="refer" element={<ReferEarn />} />
                <Route path="daily-rewards" element={<DailyRewards />} />
              </Route>

              {/* Public Info Pages */}
              <Route path="support" element={<Support />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsConditions />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
