# Pepper's Ghost Optical Stage Physics & Calibration Guide

## 1. Physical Stage Architecture
A Pepper's Ghost optical stage creates the illusion of a free-floating 3D holographic entity in physical space without requiring AR glasses or headsets.

```
       [ Eye-Level Observer ]
                 |
                 v  (Line of Sight: Horizontal Z-Axis)
      +---------------------+
      |                     |
      |   /                 | <--- 45° Semi-Reflective Beam Splitter Glass
      |  /  (Virtual Image) |      (Thickness t = 3-4mm, 70R/30T or 50R/50T)
      | /        *          |
      +---------------------+
      | [ Ultra-Bright LCD ]| <--- Flat Base Display (XZ Plane, y = 0)
      +---------------------+
```

### Key Optical Parameters
- **Display Orientation**: Horizontal flat on the chamber floor facing upward.
- **Beam Splitter Plate**: Inclined at $\theta = 45.0^\circ$ relative to the display plane.
- **Glass Specification**: High-transmittance dielectric beam splitter glass or optical acrylic (minimum 50% reflectance, 50% transmittance).
- **Stage Interior**: Matte pure black (light absorption $> 99.5\%$, e.g. Musou Black or black velvet) to prevent optical scatter.

---

## 2. Mathematical Reflection Model
The Householder reflection matrix for a mirror plane inclined at angle $\theta$ with unit normal $\mathbf{n} = [0, \sin\theta, -\cos\theta]^T$:

$$\mathbf{R}_{\Pi} = \mathbf{I} - 2\mathbf{n}\mathbf{n}^T = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 - 2\sin^2\theta & 2\sin\theta\cos\theta \\ 0 & 2\sin\theta\cos\theta & 1 - 2\cos^2\theta \end{bmatrix}$$

For an exact $\theta = 45^\circ$:
$$\sin(45^\circ) = \cos(45^\circ) = \frac{\sqrt{2}}{2}$$
$$\mathbf{R}_{45^\circ} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0 \end{bmatrix}$$

This matrix swaps the $Y$ and $Z$ axes: a horizontal depth coordinate on the display becomes a vertical height coordinate in the reflected virtual image space.

---

## 3. Optical Inversion & Chirality
Specular reflection across a single planar mirror produces a parity inversion (odd determinant $\det(\mathbf{R}) = -1$).
To compensate:
1. **Horizontal Flip ($S_x = -1$)**: Reverses mirror writing so text, gestures, and asymmetry match natural human presentation.
2. **Backface Culling Inversion**: When $S_x$ is inverted, polygon winding order flips from Counter-Clockwise (CCW) to Clockwise (CW). The renderer handles this dynamically to avoid inside-out mesh rendering.

---

## 4. FOV & Keystone Correction
- **Foreshortening Factor**: $\kappa = \cos(\theta_{\text{glass}})$. When viewing angled glass, the perceived vertical aperture is compressed. The engine applies an inverse trigonometric solver to expand vertical FOV:
  $$\tan\left(\frac{\text{FOV}_y'}{2}\right) = \frac{\tan(\text{FOV}_y / 2)}{\kappa}$$
- **Projective Homography**: If the monitor or glass is slightly tilted or misaligned, 4-point corner pinning computes the $3 \times 3$ projective matrix $\mathbf{H}$ using Direct Linear Transformation (DLT) to map the render rectangle into the physical optical trapezoid.
