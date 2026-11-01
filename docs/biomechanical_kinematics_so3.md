# Biomechanical Kinematics & 60Hz SO(3) Physics Engine

## 1. Lie Algebra so(3) and Quaternion Dynamics
Euler angles suffer from non-linear metric distortion and gimbal lock when pitch approaches $\pm 90^\circ$. In `XeroHoloGram`, all skeletal joint orientations live on the 3-sphere $\mathbb{S}^3 \subset \mathbb{H}$ representing the Lie group $\mathbb{SO}(3)$.

### Logarithmic and Exponential Mappings
For unit quaternion $\mathbf{q} = [\mathbf{v} \sin(\theta/2), \cos(\theta/2)]^T \in \mathbb{S}^3$:
$$\log(\mathbf{q}) = \frac{\theta}{\|\mathbf{v}\|} \mathbf{v} \in \mathfrak{so}(3) \cong \mathbb{R}^3$$
$$\exp(\boldsymbol{\theta}) = \left[ \frac{\boldsymbol{\theta}}{\|\boldsymbol{\theta}\|} \sin\left(\frac{\|\boldsymbol{\theta}\|}{2}\right), \cos\left(\frac{\|\boldsymbol{\theta}\|}{2}\right) \right]^T \in \mathbb{S}^3$$

---

## 2. Critically Damped Quaternion Spring-Damper
The relative error vector in Lie algebra $\mathfrak{so}(3)$ is:
$$\mathbf{q}_{\text{err}} = \mathbf{q}_{\text{target}} \cdot \mathbf{q}^{-1}$$
$$\boldsymbol{\theta}_{\text{err}} = \log(\mathbf{q}_{\text{err}}) \in \mathbb{R}^3$$

For natural frequency $\omega_n$ and damping ratio $\zeta = 1.0$ (critical damping):
$$\mathbf{a}(t) = \omega_n^2 \boldsymbol{\theta}_{\text{err}} - 2\zeta\omega_n \boldsymbol{\omega}(t)$$
$$\boldsymbol{\omega}(t + \Delta t) = \boldsymbol{\omega}(t) + \mathbf{a}(t) \Delta t$$
$$\Delta \mathbf{q} = \exp(\boldsymbol{\omega}(t + \Delta t) \Delta t)$$
$$\mathbf{q}(t + \Delta t) = \Delta \mathbf{q} \cdot \mathbf{q}(t)$$

### Benefits
- **Zero Overshoot**: Asymptotically arrives at target orientation without visual jitter.
- **Continuous Velocity**: Velocity preserves momentum when new targets arrive, avoiding robotic stops.

---

## 3. Cervical Spine Gaze Distribution
Human gaze orientation does not originate solely in the eyes; it engages the cervical vertebrae and upper thoracic spine:
- **Eyes**: $15\%$ (fast ocular saccades)
- **Head (Atlanto-occipital joint)**: $35\%$
- **Neck (C1-C7 vertebrae)**: $25\%$
- **Chest (T1-T6)**: $15\%$
- **Spine (Thoracolumbar)**: $10\%$

Every joint rotation is clamped inside anatomical conical envelopes via `JointLimitClamper`.
