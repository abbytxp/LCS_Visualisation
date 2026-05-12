## Lion City Soundscapes Dataset Visualisation
### NTU Final Year Project 2025/26
A web application that visualises characteristic soundscapes of Singapore on an interactive Leaflet map. This project was done as part of my Final Year Project (FYP) requirement at NTU and uses the dataset from 'Lion City Soundscapes'. This repository comprises of the code used to develop the web application. The web application has been deployed on GitHub Pages and can be viewed live at https://abbytxp.github.io/LCS_Visualisation/.

#### Building & Deployment 
- Ensure that "Source" is "deployed from "branch"
- "Branch" is "main"

#### Database management 
##### Locations.csv
- For "type" column, "-" maps to gray location marker
- Only to update "vidEmbed" links

#### Style.css

<details>
  <summary>Update Location Marker Style</summary>

  ```css
  /* Boring & Lifeless: Black */
  .pin-bl { background-color: #0f0e16; } 

  /* Calm & Tranquil: Green */
  .pin-ct { background-color: #76a162; } 

  /* Full of Life & Exciting: Orange */
  .pin-fe { background-color: #e68f37; } 

  /* Chaotic & Restless: Pink */
  .pin-cr { background-color: #c94370; } 

  /* "-" Type: Grey */
  .pin-dash { background-color: #9E9E9E; }
