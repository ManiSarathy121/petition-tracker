"use client";

import React, { useState } from "react";

// Instant English Phonetic to Tamil Script Converter Rules
const transliterateToTamil = (input: string): string => {
  if (!input) return "";

  let str = input;

  // Key word & location overrides for common TN names
  const overrides: Record<string, string> = {
    ocheri: "ஓச்சரி",
    nemili: "நெமிலி",
    arakkonam: "அரக்கோணம்",
    ranipet: "இராணிப்பேட்டை",
    walajah: "வாலாஜா",
    arcot: "ஆற்காடு",
    sholinghur: "சோளிங்கர்",
    kaveripakkam: "காவேரிப்பாக்கம்",
    panapakkam: "பனப்பாக்கம்",
    banavaram: "பனவரம்",
    chengalpattu: "செங்கல்பட்டு",
    chennai: "சென்னை",
    coimbatore: "கோயம்புத்தூர்",
    cuddalore: "கடலூர்",
    dharmapuri: "தர்மபுரி",
    dindigul: "திண்டுக்கல்",
    erode: "ஈரோடு",
    kallakurichi: "கள்ளக்குறிச்சி",
    kanchipuram: "காஞ்சிபுரம்",
    kanyakumari: "கன்னியாகுமரி",
    karur: "கரூர்",
    krishnagiri: "கிருஷ்ணகிரி",
    madurai: "மதுரை",
    mayiladuthurai: "மயிலாடுதுறை",
    nagapattinam: "நாகப்பட்டினம்",
    namakkal: "நாமக்கல்",
    nilgiris: "நீலகிரி",
    perambalur: "பெரம்பலூர்",
    pudukkottai: "புதுக்கோட்டை",
    ramanathapuram: "இராமநாதபுரம்",
    salem: "சேலம்",
    sivagangai: "சிவகங்கை",
    tenkasi: "தென்காசி",
    thanjavur: "தஞ்சாவூர்",
    theni: "தேனி",
    thoothukudi: "தூத்துக்குடி",
    tiruchirappalli: "திருச்சிராப்பள்ளி",
    trichy: "திருச்சி",
    tirunelveli: "திருநெல்வேலி",
    tirupathur: "திருப்பத்தூர்",
    tiruppur: "திருப்பூர்",
    tiruvallur: "திருவள்ளூர்",
    tiruvannamalai: "திருவண்ணாமலை",
    tiruvarur: "திருவாரூர்",
    vellore: "வேலூர்",
    viluppuram: "விழுப்புரம்",
    virudhunagar: "விருதுநகர்",
    mani: "மணி",
    sarathy: "சாரதி",
    petition: "மனு",
    panchayat: "ஊராட்சி",
    village: "கிராமம்",
    taluk: "வட்டம்",
    district: "மாவட்டம்"
  };

  const words = str.split(" ");
  const convertedWords = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (overrides[cleanWord]) {
      return overrides[cleanWord];
    }
    // Phonetic mapper
    return w
      .replace(/th/gi, "த")
      .replace(/sh/gi, "ஷ")
      .replace(/ch/gi, "ச")
      .replace(/ph/gi, "ப")
      .replace(/ng/gi, "ங்")
      .replace(/nj/gi, "ஞ்")
      .replace(/kn/gi, "க்ன")
      .replace(/aa/gi, "ஆ")
      .replace(/ee/gi, "ஈ")
      .replace(/oo/gi, "ஊ")
      .replace(/ai/gi, "ஐ")
      .replace(/au/gi, "ஔ")
      .replace(/a/gi, "அ")
      .replace(/i/gi, "இ")
      .replace(/u/gi, "உ")
      .replace(/e/gi, "எ")
      .replace(/o/gi, "ஒ")
      .replace(/k/gi, "க")
      .replace(/g/gi, "க")
      .replace(/s/gi, "ச")
      .replace(/j/gi, "ஜ")
      .replace(/t/gi, "த")
      .replace(/d/gi, "ட")
      .replace(/n/gi, "ன")
      .replace(/p/gi, "ப")
      .replace(/b/gi, "ப")
      .replace(/m/gi, "ம")
      .replace(/y/gi, "ய")
      .replace(/r/gi, "ர")
      .replace(/l/gi, "ல")
      .replace(/v/gi, "வ")
      .replace(/w/gi, "வ")
      .replace(/h/gi, "ஹ");
  });

  return convertedWords.join(" ");
};

interface TamilInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  isTextArea?: boolean;
  rows?: number;
  required?: boolean;
}

export function TamilInput({
  value,
  onChange,
  placeholder = "தமிழ் தட்டச்சு உதவி...",
  className = "input mt-0 ta",
  isTextArea = false,
  rows = 3,
  required = false,
}: TamilInputProps) {
  const [autoConvert, setAutoConvert] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    if (autoConvert && /[a-zA-Z]/.test(raw)) {
      const converted = transliterateToTamil(raw);
      onChange(converted);
    } else {
      onChange(raw);
    }
  };

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="text-primary-600 font-medium">அ/A</span>
          <span>தமிழ் உதவி (Tamil Assistant)</span>
        </span>
        <button
          type="button"
          onClick={() => setAutoConvert(!autoConvert)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
            autoConvert
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {autoConvert ? "✓ Phonetic Auto" : "Direct Input"}
        </button>
      </div>

      {isTextArea ? (
        <textarea
          required={required}
          rows={rows}
          className={`${className} ta`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <input
          required={required}
          type="text"
          className={`${className} ta`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
