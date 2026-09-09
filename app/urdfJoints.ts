// Joint origins and axes from the supplied Onshape URDF. Metres and radians.
export const URDF_JOINTS=[
  {
    "name": "eyelid_left",
    "parent": "head_structure",
    "child": "eyelid_left",
    "type": "revolute",
    "xyz": [
      0.0115742,
      -0.0661965,
      0.00229354
    ],
    "rpy": [
      -2.82109,
      -0.168963,
      0.906877
    ],
    "axis": [
      -0.887022,
      -0.461727,
      -0.0
    ],
    "lower": -2.79253,
    "upper": 0.349066
  },
  {
    "name": "eyelid_right",
    "parent": "head_structure",
    "child": "eyelid_right",
    "type": "revolute",
    "xyz": [
      -0.0150824,
      -0.0654861,
      0.00230289
    ],
    "rpy": [
      -1.75474,
      0.47942,
      -0.591111
    ],
    "axis": [
      0.887022,
      -0.461727,
      -0.0
    ],
    "lower": -1.39626,
    "upper": 1.74533
  },
  {
    "name": "fixed_node_to_root_joint",
    "parent": "root",
    "child": "body_structure",
    "type": "fixed",
    "xyz": [
      0.0,
      0.0,
      0.0
    ],
    "rpy": [
      0.0,
      -0.0,
      0.0
    ],
    "axis": [
      0.0,
      0.0,
      1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint",
    "parent": "cheek_right",
    "child": "cheek_left",
    "type": "fixed",
    "xyz": [
      -8.67362e-19,
      -1.0842e-19,
      4.33681e-19
    ],
    "rpy": [
      -4.01612e-40,
      -2.40978e-21,
      3.33318e-19
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint_1",
    "parent": "nose",
    "child": "eye_1",
    "type": "fixed",
    "xyz": [
      -8.67362e-19,
      -1.0842e-19,
      4.33681e-19
    ],
    "rpy": [
      -4.01612e-40,
      -2.40978e-21,
      3.33318e-19
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint_2",
    "parent": "head_structure",
    "child": "head",
    "type": "fixed",
    "xyz": [
      0.00455225,
      0.169881,
      -0.0446012
    ],
    "rpy": [
      0.0131666,
      0.000350943,
      -0.0266464
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint_3",
    "parent": "head",
    "child": "cheek_right",
    "type": "fixed",
    "xyz": [
      -8.67362e-19,
      -1.0842e-19,
      4.33681e-19
    ],
    "rpy": [
      -4.01612e-40,
      -2.40978e-21,
      3.33318e-19
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint_4",
    "parent": "eye_1",
    "child": "eye",
    "type": "fixed",
    "xyz": [
      -0.0838514,
      1.0842e-17,
      3.9465e-17
    ],
    "rpy": [
      -4.01612e-40,
      -2.40978e-21,
      3.33318e-19
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_1_fastened_joint_5",
    "parent": "cheek_left",
    "child": "nose",
    "type": "fixed",
    "xyz": [
      -8.67362e-19,
      -1.0842e-19,
      4.33681e-19
    ],
    "rpy": [
      -4.01612e-40,
      -2.40978e-21,
      3.33318e-19
    ],
    "axis": [
      -0.0,
      -0.0,
      -1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "group_2_fastened_joint",
    "parent": "body_structure",
    "child": "main_body",
    "type": "fixed",
    "xyz": [
      0.0,
      0.0,
      0.0
    ],
    "rpy": [
      0.0,
      -0.0,
      0.0
    ],
    "axis": [
      0.0,
      0.0,
      1.0
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "neck_dof",
    "parent": "body_structure",
    "child": "neck_dof_1",
    "type": "revolute",
    "xyz": [
      -4.00968e-05,
      -0.16934,
      0.0468348
    ],
    "rpy": [
      -4.67594e-06,
      -0.000350941,
      -2.31038e-06
    ],
    "axis": [
      0.0,
      1.0,
      0.0
    ],
    "lower": -0.772227,
    "upper": 0.798569
  },
  {
    "name": "neck_dof_1",
    "parent": "neck_dof_1",
    "child": "neck_dof",
    "type": "revolute",
    "xyz": [
      0.0,
      0.0,
      0.0
    ],
    "rpy": [
      0.0,
      -0.0,
      0.0
    ],
    "axis": [
      8.1634e-17,
      0.0,
      -1.0
    ],
    "lower": -0.812047,
    "upper": 0.758749
  },
  {
    "name": "neck_dof_2",
    "parent": "neck_dof",
    "child": "head_structure",
    "type": "continuous",
    "xyz": [
      0.0,
      0.0,
      0.0
    ],
    "rpy": [
      0.0,
      -0.0,
      0.0
    ],
    "axis": [
      -1.0,
      0.0,
      -8.1634e-17
    ],
    "lower": null,
    "upper": null
  },
  {
    "name": "revolute_1",
    "parent": "body_structure",
    "child": "arm_left",
    "type": "revolute",
    "xyz": [
      0.083211,
      -0.0695891,
      -1.22363e-17
    ],
    "rpy": [
      5.50775e-17,
      -2.77556e-16,
      1.06859e-15
    ],
    "axis": [
      -0.938187,
      0.346128,
      -0.0
    ],
    "lower": -2.79253,
    "upper": 8.88178e-16
  },
  {
    "name": "revolute_2",
    "parent": "body_structure",
    "child": "arm_right",
    "type": "revolute",
    "xyz": [
      -0.083211,
      -0.0695891,
      -2.02346e-17
    ],
    "rpy": [
      2.14455e-18,
      -1.20087e-17,
      1.47899e-31
    ],
    "axis": [
      -0.938187,
      -0.346128,
      0.0
    ],
    "lower": -2.79253,
    "upper": 8.88178e-16
  },
  {
    "name": "revolute_3",
    "parent": "body_structure",
    "child": "leg_right",
    "type": "revolute",
    "xyz": [
      -0.0710668,
      0.0794403,
      -0.015
    ],
    "rpy": [
      0.0,
      -0.0,
      0.0
    ],
    "axis": [
      0.897123,
      -0.441782,
      0.0
    ],
    "lower": 0.0,
    "upper": 3.14159
  },
  {
    "name": "revolute_4",
    "parent": "body_structure",
    "child": "leg_left",
    "type": "revolute",
    "xyz": [
      0.0710668,
      0.0794403,
      -0.015
    ],
    "rpy": [
      -9.52789e-16,
      2.64589e-15,
      -2.35453e-14
    ],
    "axis": [
      -0.897123,
      -0.441782,
      0.0
    ],
    "lower": -2.79253,
    "upper": 4.70735e-14
  }
];
