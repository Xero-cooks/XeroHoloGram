from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class RigProfileConfig(BaseModel):
    version: str = "1.0.0"
    rig_name: str = "custom_rig"
    source_format: str = "glb"  # glb, gltf, vrm
    bone_mappings: Dict[str, str] = Field(default_factory=dict)
    axis_inversions: Dict[str, Tuple[bool, bool, bool]] = Field(default_factory=dict)
    rest_pose_offset_quaternions: Dict[str, Tuple[float, float, float, float]] = Field(default_factory=dict)
    morph_mappings: Dict[str, str] = Field(default_factory=dict)
    bounding_box_scale: float = 1.0
