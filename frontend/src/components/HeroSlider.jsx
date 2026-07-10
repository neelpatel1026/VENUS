// import { useState, useEffect } from "react";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

import "swiper/css";
import "./../styles/heroslider.css";

import hero1 from "../assets/hero1.jpg";
import hero2 from "../assets/hero2.jpg";
import hero3 from "../assets/hero3.jpg";
import herovideo from "../assets/herovideo.mp4";

import mp1 from "../assets/mp1.jpg";
import mp2 from "../assets/mp2.jpg";
import mp3 from "../assets/mp3.jpg";
import mobile from "../assets/mobile.mp4";



// const slides = [
//   { type: "video", src: herovideo, delay: 29000 },
//   { type: "image", src: hero1, delay: 3000 },
//   { type: "image", src: hero2, delay: 3000 },
//   { type: "image", src: hero3, delay: 3000 },
// ];



export default function HeroSlider() {

  const videoRef = useRef(null);

  const isMobile = window.innerWidth <= 768;

  const slides = [
    {
      type: "video",
      src: isMobile ? mobile : herovideo,
      // delay: 29000,
      delay: isMobile ? 5000 : 29000,
    },
    {
      type: "image",
      src: isMobile ? mp1 : hero1,
      delay: 1000,
    },
    {
      type: "image",
      src: isMobile ? mp2 : hero2,
      delay: 1000,
    },
    {
      type: "image",
      src: isMobile ? mp3 : hero3,
      delay: 1000,
    },
  ];
  
  return (

<Swiper
  className="hero-slider"
  modules={[Autoplay, EffectFade]}
  effect="fade"
  speed={1500}
  fadeEffect={{
    crossFade: true,
  }}
  autoplay={{
    delay: 3000,
    disableOnInteraction: false,
  }}
  loop={true}
  onSlideChange={(swiper) => {
    const currentSlide = slides[swiper.realIndex];

    if (currentSlide.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video play request interrupted:", err.message);
        });
      }
    }
  }}
>


      {slides.map((slide, index) => (
  <SwiperSlide
    key={index}
    data-swiper-autoplay={slide.delay}
  >
    <div className="hero-slide">
      {slide.type === "video" ? (
        <video
        ref={videoRef}
          className="hero-video"
          muted
          playsInline
          autoPlay
        >
          <source src={slide.src} type="video/mp4" />
        </video>
      ) : (
        <img src={slide.src} alt={`Venus Care Banner Slide ${index + 1}`} />
      )}
    </div>
  </SwiperSlide>
      ))}
    </Swiper>
  );
}
