# Physical Holographic Stage Construction Blueprint

## 1. Bill of Materials (BOM)
| Component | Specification | Function |
| :--- | :--- | :--- |
| **Base Display** | 15.6" or 24" 1080p/4K IPS Display ($\ge 400\text{ nits}$) | Horizontal image emission |
| **Beam Splitter Plate** | 50R/50T or 70R/30T Dielectric Coated Glass ($3-4\text{mm}$) | 45° Semi-reflective Pythagorean mirror |
| **Chamber Frame** | 5mm Matte Black Acrylic or Anodized Extruded Aluminum | Light-absorbing physical structure |
| **Light Absorption Lining** | Musou Black / Black Velvet ($>99.5\%$ light trap) | Pure background occlusion |
| **Cooling Fan** | 120mm Silent 5V USB Fan ($<18\text{dB}$) | Base display heat dissipation |
| **Microphone Array** | USB Boundary / Conference Microphone with AEC | User voice capture |

---

## 2. Geometric Alignment & Angles
```text
                  Observer Eye Level
                          |
                          v
         +----------------------------------+
         |                                  |
         |    \ (45.0° Inclined Glass)      |
         |     \                            |
         |      \      * (Virtual 3D Avatar)|
         |       \                          |
         +----------------------------------+
         |       [ Base LCD Monitor ]       |
         +----------------------------------+
```

### Critical Tolerances
1. **Glass Tilt Angle**: Maintain exactly $45.0^\circ \pm 0.5^\circ$. Deviations can be software-compensated via the `OpticalControls` slider.
2. **Reflective Coating Side**: The coated dielectric side of the glass plate **must face downward towards the display** to avoid double-reflection ghosting.
3. **Display Bezel Concealment**: Ensure display bezels and monitor power LEDs are masked with black tape to avoid secondary optical reflections.
