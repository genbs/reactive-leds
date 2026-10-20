// Adaptive pipe clamp

// Clamp dimensions
pipe_diameter = 29.0;
wall_thickness = 2.5;
clamp_depth = 15.0;
clamp_opening_width = pipe_diameter - 1.5;

// Mounting base
base_height = 6.0;
base_corner_bevel = 0.0;

// Fastener dimensions
screw_head_diameter = 7.8;
screw_head_height = 3.0;
screw_stem_diameter = 3.1;
printing_clearance = 0.4;
screw_tool_overlap = 0.1;
screw_head_sink_depth = 1.5;

// Rendering and boolean-operation tolerances
render_resolution = 80;
preview_epsilon = 0.1;
$fn = render_resolution;

// Derived geometry
inner_radius = pipe_diameter / 2;
outer_radius = inner_radius + wall_thickness;
entry_bead_radius = wall_thickness * 0.7;
wing_intersection_x = sqrt(max(0, outer_radius * outer_radius - inner_radius * inner_radius));
base_width = 2 * (outer_radius + base_corner_bevel);
bead_center_y = sqrt(max(0, outer_radius * outer_radius - pow(clamp_opening_width / 2, 2)));
bead_gap_width = clamp_opening_width - 2 * entry_bead_radius;
inner_pipe_wall_y = -inner_radius;
screw_seat_y = inner_pipe_wall_y - screw_head_sink_depth;

module screw_hole_tool() {
    stem_hole_diameter = screw_stem_diameter + printing_clearance;
    tunnel_length = screw_head_sink_depth + 5;

    // Form the screw head seat, transition, and stem hole.
    translate([0, screw_seat_y, 0])
    rotate([90, 0, 0]) {
        cylinder(h = screw_tool_overlap, r = screw_head_diameter / 2, center = true);

        translate([0, 0, screw_tool_overlap / 2])
        cylinder(
            h = screw_head_height,
            r1 = screw_head_diameter / 2,
            r2 = stem_hole_diameter / 2
        );

        translate([0, 0, screw_head_height])
        cylinder(h = base_height + 10, r = stem_hole_diameter / 2);
    }

    // Provide access to the recessed screw head.
    translate([0, screw_seat_y + tunnel_length / 2 - preview_epsilon, 0])
    rotate([90, 0, 0])
    cylinder(h = tunnel_length, r = screw_head_diameter / 2, center = true);
}

module upper_grip() {
    union() {
        // Cut the opening and bead reliefs from the clamp ring.
        difference() {
            cylinder(h = clamp_depth, r = outer_radius, center = true);

            translate([0, outer_radius + preview_epsilon, 0])
            cube([bead_gap_width, 2 * outer_radius, clamp_depth + 2], center = true);

            for (side = [-1, 1]) {
                translate([
                    side * clamp_opening_width / 2,
                    bead_center_y + outer_radius + preview_epsilon,
                    0
                ])
                cube([2 * entry_bead_radius, 2 * outer_radius, clamp_depth + 2], center = true);
            }
        }

        // Add rounded lead-in beads at both sides of the opening.
        for (side = [-1, 1]) {
            translate([side * clamp_opening_width / 2, bead_center_y, 0])
            cylinder(h = clamp_depth, r = entry_bead_radius, center = true);
        }
    }
}

module clamp_body() {
    wing_width = abs(outer_radius - wing_intersection_x);
    wing_height = abs(inner_pipe_wall_y);

    difference() {
        union() {
            upper_grip();

            // Join the mounting base to the clamp ring.
            translate([0, -inner_radius - base_height / 2, 0])
            cube([base_width, base_height, clamp_depth], center = true);

            // Add support wings beneath the ring.
            for (side = [-1, 1]) {
                translate([
                    side == 1 ? outer_radius - wing_width : -outer_radius,
                    inner_pipe_wall_y,
                    -clamp_depth / 2
                ])
                cube([wing_width, wing_height, clamp_depth], center = false);
            }
        }

        // Clear the pipe bore through the ring and support wings.
        cylinder(h = clamp_depth + 2, r = inner_radius, center = true);

        // Cut the optional bevels at the mounting-base corners.
        for (side = [-1, 1]) {
            translate([
                side * (base_width / 2 + preview_epsilon),
                -inner_radius + preview_epsilon,
                0
            ])
            rotate([0, 0, side * 45])
            cube([
                base_corner_bevel * sqrt(2),
                base_corner_bevel * sqrt(2),
                clamp_depth + 2
            ], center = true);
        }
    }
}

// Subtract the fastener tool from the clamp body.
difference() {
    clamp_body();
    screw_hole_tool();
}
