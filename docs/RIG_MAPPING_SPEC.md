# Canonical 28-Joint Humanoid Schema & Auto-Mapping Specification

## 1. Canonical 28 Joints Schema
The core 28 joints supported across all gestures, spring physics, and kinematic animations:

1. `pelvis` (Root / Hips)
2. `spine_01` (Lower Spine)
3. `spine_02` (Chest / Thoracic Spine)
4. `neck` (Cervical Spine)
5. `head` (Skull / Cranium)
6. `jaw` (Articulated Mandible)
7. `clavicle_L` / `clavicle_R` (Shoulder girdles)
8. `upper_arm_L` / `upper_arm_R` (Humerus)
9. `lower_arm_L` / `lower_arm_R` (Forearm / Radius-Ulna)
10. `hand_L` / `hand_R` (Wrists)
11. `thumb_L` / `thumb_R` (Thumb proximal)
12. `index_L` / `index_R` (Index finger proximal)
13. `middle_L` / `middle_R` (Middle finger proximal)
14. `ring_L` / `ring_R` (Ring finger proximal)
15. `pinky_L` / `pinky_R` (Pinky finger proximal)
16. `upper_leg_L` / `upper_leg_R` (Femur / Thigh)
17. `lower_leg_L` / `lower_leg_R` (Shin / Tibia)

## 2. Rest-Pose Calibration Formulation
$$q_j^{\text{world}}(t) = q_j^{\text{bind}} \otimes q_j^{\text{calib}} \otimes q_j^{\text{dynamic}}(t)$$

- $q_j^{\text{bind}}$: Source 3D model's rest-pose quaternion.
- $q_j^{\text{calib}}$: T-Pose / A-Pose corrective delta quaternion.
- $q_j^{\text{dynamic}}(t)$: Real-time dynamic rotation angle computed by the 60Hz SO(3) spring-damper.
