# Universal Rigging & Bone Studio Technical Guide

## 1. Universal Humanoid Rig Topology
`XeroHoloGram` standardizes all incoming 3D character skeletons into a canonical 55-bone hierarchy. Any rigged character from Mixamo, VRoid Studio (VRM), Unreal Engine, or Blender Rigify can be auto-mapped or manually refined in the interactive Bone Studio.

### Canonical Topology
- **Core (9 bones)**: `Hips`, `Spine`, `Chest`, `UpperChest`, `Neck`, `Head`, `LeftEye`, `RightEye`, `Jaw`
- **Left Arm (4 bones)**: `LeftShoulder`, `LeftUpperArm`, `LeftLowerArm`, `LeftHand`
- **Right Arm (4 bones)**: `RightShoulder`, `RightUpperArm`, `RightLowerArm`, `RightHand`
- **Hands & Fingers (30 bones)**: 5 digits per hand $\times$ 3 phalanges (`Metacarpal/Proximal`, `Intermediate`, `Distal`)
- **Lower Body (8 bones)**: `UpperLeg`, `LowerLeg`, `Foot`, `Toes` (Left & Right)

---

## 2. Automated Heuristic Mappers
When a `.glb`, `.gltf`, or `.vrm` file is imported:
1. `MixamoMapper`: Strips namespace prefixes (`mixamorig:`, `mixamorig9:`) and matches anatomical substrings.
2. `VRMMapper`: Inspects `VRMC_vrm` or `VRM` extension headers, falling back to `J_Bip_` naming.
3. `UnrealEngineMapper`: Matches UE4/UE5 naming (`pelvis`, `spine_01`, `clavicle_l`, `upperarm_l`).
4. `BlenderRigifyMapper`: Matches deform bones prefixed with `DEF-`.

Confidence scores:
- Exact regex pattern match: $\ge 0.95$
- Substring heuristic match: $0.70 - 0.90$
- Manual override: $1.00$

---

## 3. Bind Pose Normalization (T-Pose vs. A-Pose)
Many characters (especially VRM / game assets) are modeled in **A-Pose** ($45^\circ$ downward arms) rather than canonical **T-Pose** ($90^\circ$ horizontal arms).
`BindPoseNormalizer` detects A-pose by analyzing the direction vector $\mathbf{v} = \mathbf{p}_{\text{hand}} - \mathbf{p}_{\text{arm}}$.
If $v_y < -0.25$, an offset quaternion rotation:
$$\mathbf{q}_{\Delta, \text{left}} = \text{Rot}_Z(+45^\circ), \quad \mathbf{q}_{\Delta, \text{right}} = \text{Rot}_Z(-45^\circ)$$
is pre-multiplied before applying animation gestures, preventing arms from clipping into the torso.
