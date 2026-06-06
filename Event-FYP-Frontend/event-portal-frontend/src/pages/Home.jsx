import Features from "../components/Features";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import UpcomingEvents from "../components/UpcomingEvents";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <>
    <Navbar />
      <Hero />
      <UpcomingEvents />
      <Features />
    
      <CTA/>
      <Footer/>
    </>
  );
};

export default Home;