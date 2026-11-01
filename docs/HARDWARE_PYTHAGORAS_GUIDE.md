# Pythagorean 45-Degree Optical Stage Measurement Guide

## 1. Stage Geometry Calculation
For a Pepper's Ghost optical chamber with base display depth $B$, back wall height $H$, and diagonal semi-reflective hypotenuse $C$:

$$C = \sqrt{B^2 + H^2}$$

For a standard square box where $B = 20\text{ cm}$ and $H = 20\text{ cm}$:
$$C = \sqrt{20^2 + 20^2} = \sqrt{800} \approx 28.28\text{ cm}$$

The inclination angle of the hypotenuse beam splitter is:
$$\theta = \arctan\left(\frac{H}{B}\right) = \arctan(1.0) = 45.0^\circ$$

## 2. Inversion Modes
- **Dock Facing Keyboard Edge**: Standard `scaleX(-1)` mirror inversion.
- **Dock Facing Rear Edge**: `scaleY(-1)` vertical flip.
- **4-Sided Pyramid Dock**: Quad-frustum projection facing 4 orthogonal angles ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).

## 3. Safe Bounding Margins
To prevent character limbs or head from clipping off the top or edges of the glass plate:
$$\text{Safe Height} = H \times 0.85$$
$$\text{Safe Width} = B \times 0.80$$
The character origin is anchored at eye-level height ($y \approx 1.45\text{m}$).
