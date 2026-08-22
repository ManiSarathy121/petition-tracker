-- Seed: 38 Tamil Nadu districts + common departments (bilingual)
insert into districts (code, name_en, name_ta) values
 ('ARY','Ariyalur','அரியலூர்'),('CGL','Chengalpattu','செங்கல்பட்டு'),
 ('CHN','Chennai','சென்னை'),('CBE','Coimbatore','கோயம்புத்தூர்'),
 ('CUD','Cuddalore','கடலூர்'),('DHR','Dharmapuri','தர்மபுரி'),
 ('DGL','Dindigul','திண்டுக்கல்'),('ERD','Erode','ஈரோடு'),
 ('KLK','Kallakurichi','கள்ளக்குறிச்சி'),('KAN','Kanchipuram','காஞ்சிபுரம்'),
 ('KNY','Kanyakumari','கன்னியாகுமரி'),('KRR','Karur','கரூர்'),
 ('KGR','Krishnagiri','கிருஷ்ணகிரி'),('MDU','Madurai','மதுரை'),
 ('MYL','Mayiladuthurai','மயிலாடுதுறை'),('NGP','Nagapattinam','நாகப்பட்டினம்'),
 ('NMK','Namakkal','நாமக்கல்'),('NIL','Nilgiris','நீலகிரி'),
 ('PBR','Perambalur','பெரம்பலூர்'),('PDK','Pudukkottai','புதுக்கோட்டை'),
 ('RMD','Ramanathapuram','இராமநாதபுரம்'),('RNP','Ranipet','இராணிப்பேட்டை'),
 ('SLM','Salem','சேலம்'),('SVG','Sivagangai','சிவகங்கை'),
 ('TNK','Tenkasi','தென்காசி'),('TNJ','Thanjavur','தஞ்சாவூர்'),
 ('THN','Theni','தேனி'),('TTK','Thoothukudi','தூத்துக்குடி'),
 ('TRY','Tiruchirappalli','திருச்சிராப்பள்ளி'),('TNV','Tirunelveli','திருநெல்வேலி'),
 ('TPR','Tirupathur','திருப்பத்தூர்'),('TPP','Tiruppur','திருப்பூர்'),
 ('TVL','Tiruvallur','திருவள்ளூர்'),('TVM','Tiruvannamalai','திருவண்ணாமலை'),
 ('TVR','Tiruvarur','திருவாரூர்'),('VLR','Vellore','வேலூர்'),
 ('VPM','Viluppuram','விழுப்புரம்'),('VNR','Virudhunagar','விருதுநகர்')
on conflict (name_en) do nothing;

insert into departments (code, name_en, name_ta) values
 ('REV','Revenue','வருவாய்த் துறை'),
 ('RDP','Rural Development & Panchayat Raj','ஊரக வளர்ச்சி மற்றும் ஊராட்சி'),
 ('PWD','Public Works Department','பொதுப்பணித் துறை'),
 ('HWY','Highways','நெடுஞ்சாலைத் துறை'),
 ('EB','Electricity (TANGEDCO)','மின்சாரத் துறை'),
 ('TWAD','Water Supply (TWAD)','குடிநீர் வழங்கல் வாரியம்'),
 ('HLT','Health & Family Welfare','சுகாதாரம் மற்றும் குடும்ப நலத்துறை'),
 ('EDU','School Education','பள்ளிக் கல்வித் துறை'),
 ('SW','Social Welfare','சமூக நலத்துறை'),
 ('AGR','Agriculture','வேளாண்மைத் துறை'),
 ('POL','Police','காவல் துறை'),
 ('MUN','Municipal Administration','நகராட்சி நிர்வாகம்'),
 ('TRN','Transport','போக்குவரத்துத் துறை'),
 ('ADW','Adi Dravidar Welfare','ஆதிதிராவிடர் நலத்துறை'),
 ('FCS','Food & Civil Supplies','உணவு மற்றும் நுகர்பொருள் வழங்கல்')
on conflict (name_en) do nothing;
