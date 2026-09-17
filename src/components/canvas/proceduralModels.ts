import * as THREE from "three";
import { PlacedObject } from "../../types";

// Cached geometry & material helpers for high performance & clean rendering
export function createProceduralFurniture(item: PlacedObject): THREE.Group {
  const group = new THREE.Group();
  group.name = `furniture_${item.id}`;
  group.userData = { id: item.id, itemData: item };

  const { width, height, depth } = item.dimensions;
  const primaryColor = new THREE.Color(item.color || "#D6CFC4");
  const accentColor = new THREE.Color(item.accentColor || "#7A6753");
  const darkDetailColor = new THREE.Color("#22201D");
  const woodColor = new THREE.Color("#6A4E38");

  // Reusable materials with realistic roughness and metalness
  const fabricMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.85,
    metalness: 0.05,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.6,
    metalness: 0.15,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.7,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: darkDetailColor,
    roughness: 0.35,
    metalness: 0.8,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#C8A251"),
    roughness: 0.25,
    metalness: 0.85,
  });

  switch (item.proceduralType) {
    case "modern_sofa": {
      // Base platform
      const baseH = 0.12;
      const legH = 0.14;
      const legGeo = new THREE.CylinderGeometry(0.025, 0.015, legH, 12);
      const legPositions = [
        [-width / 2 + 0.1, legH / 2, -depth / 2 + 0.1],
        [width / 2 - 0.1, legH / 2, -depth / 2 + 0.1],
        [-width / 2 + 0.1, legH / 2, depth / 2 - 0.1],
        [width / 2 - 0.1, legH / 2, depth / 2 - 0.1],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      });

      // Bottom support plinth
      const baseGeo = new THREE.BoxGeometry(width - 0.05, baseH, depth - 0.05);
      const baseMesh = new THREE.Mesh(baseGeo, woodMat);
      baseMesh.position.set(0, legH + baseH / 2, 0);
      baseMesh.castShadow = true;
      group.add(baseMesh);

      // Seat Cushions (3 cushions)
      const seatCushionY = legH + baseH;
      const cushionW = (width - 0.28) / 3;
      const cushionH = 0.18;
      const cushionD = depth - 0.24;
      const cushionGeo = new THREE.BoxGeometry(cushionW - 0.02, cushionH, cushionD);
      for (let i = 0; i < 3; i++) {
        const cx = -width / 2 + 0.14 + cushionW / 2 + i * cushionW;
        const cushion = new THREE.Mesh(cushionGeo, fabricMat);
        cushion.position.set(cx, seatCushionY + cushionH / 2, 0.04);
        cushion.castShadow = true;
        group.add(cushion);
      }

      // Backrest
      const backH = height - (legH + baseH);
      const backD = 0.2;
      const backGeo = new THREE.BoxGeometry(width, backH, backD);
      const backMesh = new THREE.Mesh(backGeo, fabricMat);
      backMesh.position.set(0, legH + baseH + backH / 2, -depth / 2 + backD / 2);
      backMesh.castShadow = true;
      group.add(backMesh);

      // Back Pillows (3 pillows)
      const pillowGeo = new THREE.BoxGeometry(cushionW - 0.04, backH * 0.75, 0.12);
      for (let i = 0; i < 3; i++) {
        const px = -width / 2 + 0.14 + cushionW / 2 + i * cushionW;
        const pillow = new THREE.Mesh(pillowGeo, fabricMat);
        pillow.position.set(px, seatCushionY + cushionH + (backH * 0.75) / 2 - 0.04, -depth / 2 + backD + 0.06);
        pillow.rotation.x = -0.08;
        pillow.castShadow = true;
        group.add(pillow);
      }

      // Armrests (Left & Right)
      const armW = 0.14;
      const armH = backH * 0.72;
      const armGeo = new THREE.BoxGeometry(armW, armH, depth);
      const armL = new THREE.Mesh(armGeo, fabricMat);
      armL.position.set(-width / 2 + armW / 2, legH + baseH + armH / 2, 0);
      armL.castShadow = true;
      group.add(armL);

      const armR = new THREE.Mesh(armGeo, fabricMat);
      armR.position.set(width / 2 - armW / 2, legH + baseH + armH / 2, 0);
      armR.castShadow = true;
      group.add(armR);

      break;
    }

    case "lounge_chair": {
      // Scandinavian barrel armchair
      const legH = 0.22;
      // Brass angled legs
      const legGeo = new THREE.CylinderGeometry(0.018, 0.012, legH + 0.06, 12);
      const l1 = new THREE.Mesh(legGeo, brassMat);
      l1.position.set(-width * 0.32, legH / 2, -depth * 0.28);
      l1.rotation.set(-0.15, 0, -0.15);
      group.add(l1);

      const l2 = new THREE.Mesh(legGeo, brassMat);
      l2.position.set(width * 0.32, legH / 2, -depth * 0.28);
      l2.rotation.set(-0.15, 0, 0.15);
      group.add(l2);

      const l3 = new THREE.Mesh(legGeo, brassMat);
      l3.position.set(-width * 0.32, legH / 2, depth * 0.28);
      l3.rotation.set(0.15, 0, -0.15);
      group.add(l3);

      const l4 = new THREE.Mesh(legGeo, brassMat);
      l4.position.set(width * 0.32, legH / 2, depth * 0.28);
      l4.rotation.set(0.15, 0, 0.15);
      group.add(l4);

      // Curved seat bowl base
      const seatBaseGeo = new THREE.CylinderGeometry(width * 0.45, width * 0.38, 0.14, 24);
      const seatBase = new THREE.Mesh(seatBaseGeo, fabricMat);
      seatBase.position.set(0, legH + 0.07, 0);
      seatBase.castShadow = true;
      group.add(seatBase);

      // Plush seat cushion
      const cushionGeo = new THREE.CylinderGeometry(width * 0.42, width * 0.42, 0.12, 24);
      const cushion = new THREE.Mesh(cushionGeo, fabricMat);
      cushion.position.set(0, legH + 0.14 + 0.06, 0.03);
      cushion.castShadow = true;
      group.add(cushion);

      // Curved wrap-around backrest
      const backH = height - (legH + 0.14);
      const backGeo = new THREE.CylinderGeometry(
        width * 0.46,
        width * 0.44,
        backH,
        24,
        1,
        true,
        Math.PI * 0.6,
        Math.PI * 1.8
      );
      const backShell = new THREE.Mesh(
        backGeo,
        new THREE.MeshStandardMaterial({
          color: primaryColor,
          side: THREE.DoubleSide,
          roughness: 0.8,
        })
      );
      backShell.position.set(0, legH + 0.14 + backH / 2, -0.05);
      backShell.rotation.y = Math.PI;
      backShell.castShadow = true;
      group.add(backShell);

      // Accent lumbar pillow
      const lumbarGeo = new THREE.BoxGeometry(width * 0.4, 0.22, 0.08);
      const lumbar = new THREE.Mesh(lumbarGeo, accentMat);
      lumbar.position.set(0, legH + 0.24, -depth * 0.18);
      lumbar.rotation.x = -0.12;
      group.add(lumbar);

      break;
    }

    case "coffee_table": {
      // Chunky organic solid oak coffee table
      const topH = 0.05;
      const legH = height - topH;
      // Elliptical rounded top
      const topGeo = new THREE.CylinderGeometry(width / 2, width / 2, topH, 32);
      topGeo.scale(1, 1, depth / width);
      const top = new THREE.Mesh(topGeo, woodMat);
      top.position.set(0, height - topH / 2, 0);
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // 3 Architectural cylinder legs
      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, legH, 20);
      const pillarPos = [
        [-width * 0.28, legH / 2, -depth * 0.15],
        [width * 0.28, legH / 2, -depth * 0.15],
        [0, legH / 2, depth * 0.25],
      ];
      pillarPos.forEach(([px, py, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, woodMat);
        pillar.position.set(px, py, pz);
        pillar.castShadow = true;
        group.add(pillar);
      });

      // Decorative ceramic book / tray on top
      const trayGeo = new THREE.BoxGeometry(0.28, 0.02, 0.2);
      const tray = new THREE.Mesh(trayGeo, accentMat);
      tray.position.set(0.12, height + 0.01, 0.02);
      group.add(tray);

      break;
    }

    case "dining_table": {
      // Modern dining table with tabletop & trestle legs + 4 dining chairs
      const topH = 0.045;
      const legH = height - topH;
      const topGeo = new THREE.BoxGeometry(width, topH, depth);
      const top = new THREE.Mesh(topGeo, woodMat);
      top.position.set(0, height - topH / 2, 0);
      top.castShadow = true;
      group.add(top);

      // Trestle legs
      const legThickness = 0.06;
      const trestleW = depth * 0.78;
      const trestleGeo = new THREE.BoxGeometry(legThickness, legH, trestleW);
      const legL = new THREE.Mesh(trestleGeo, woodMat);
      legL.position.set(-width / 2 + 0.22, legH / 2, 0);
      legL.castShadow = true;
      group.add(legL);

      const legR = new THREE.Mesh(trestleGeo, woodMat);
      legR.position.set(width / 2 - 0.22, legH / 2, 0);
      legR.castShadow = true;
      group.add(legR);

      // Stretcher bar
      const stretchGeo = new THREE.BoxGeometry(width - 0.44, 0.04, 0.06);
      const stretcher = new THREE.Mesh(stretchGeo, woodMat);
      stretcher.position.set(0, legH * 0.25, 0);
      group.add(stretcher);

      // 4 Minimalist dining chairs tucked in
      const chairH = 0.78;
      const chairSeatH = 0.45;
      const chairSeatW = 0.42;
      const chairSeatD = 0.42;
      const chairMat = accentMat;

      const chairConfigs = [
        { x: -width * 0.25, z: -depth / 2 - 0.25, rotY: 0 },
        { x: width * 0.25, z: -depth / 2 - 0.25, rotY: 0 },
        { x: -width * 0.25, z: depth / 2 + 0.25, rotY: Math.PI },
        { x: width * 0.25, z: depth / 2 + 0.25, rotY: Math.PI },
      ];

      chairConfigs.forEach((cfg) => {
        const chairGroup = new THREE.Group();
        // Seat
        const cSeat = new THREE.Mesh(new THREE.BoxGeometry(chairSeatW, 0.03, chairSeatD), chairMat);
        cSeat.position.set(0, chairSeatH, 0);
        chairGroup.add(cSeat);
        // Back
        const cBack = new THREE.Mesh(new THREE.BoxGeometry(chairSeatW, 0.25, 0.025), chairMat);
        cBack.position.set(0, chairSeatH + 0.2, -chairSeatD / 2 + 0.015);
        chairGroup.add(cBack);
        // Legs
        const cLegGeo = new THREE.CylinderGeometry(0.012, 0.01, chairSeatH, 8);
        [
          [-chairSeatW / 2 + 0.03, chairSeatH / 2, -chairSeatD / 2 + 0.03],
          [chairSeatW / 2 - 0.03, chairSeatH / 2, -chairSeatD / 2 + 0.03],
          [-chairSeatW / 2 + 0.03, chairSeatH / 2, chairSeatD / 2 - 0.03],
          [chairSeatW / 2 - 0.03, chairSeatH / 2, chairSeatD / 2 - 0.03],
        ].forEach(([lx, ly, lz]) => {
          const l = new THREE.Mesh(cLegGeo, metalMat);
          l.position.set(lx, ly, lz);
          chairGroup.add(l);
        });

        chairGroup.position.set(cfg.x, 0, cfg.z);
        chairGroup.rotation.y = cfg.rotY;
        group.add(chairGroup);
      });

      break;
    }

    case "platform_bed": {
      // Platform frame
      const frameH = 0.26;
      const frameGeo = new THREE.BoxGeometry(width, frameH, depth);
      const frame = new THREE.Mesh(frameGeo, woodMat);
      frame.position.set(0, frameH / 2, 0);
      frame.castShadow = true;
      group.add(frame);

      // Padded linen headboard
      const headH = height;
      const headD = 0.12;
      const headGeo = new THREE.BoxGeometry(width + 0.1, headH, headD);
      const head = new THREE.Mesh(headGeo, fabricMat);
      head.position.set(0, headH / 2, -depth / 2 + headD / 2);
      head.castShadow = true;
      group.add(head);

      // Mattress
      const matW = width - 0.12;
      const matD = depth - headD - 0.1;
      const matH = 0.22;
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(matW, matH, matD),
        new THREE.MeshStandardMaterial({ color: "#F7F5F0", roughness: 0.9 })
      );
      mattress.position.set(0, frameH + matH / 2, headD / 2);
      group.add(mattress);

      // Folded duvet quilt
      const duvetL = matD * 0.65;
      const duvet = new THREE.Mesh(
        new THREE.BoxGeometry(matW + 0.04, 0.06, duvetL),
        fabricMat
      );
      duvet.position.set(0, frameH + matH + 0.03, headD / 2 + (matD - duvetL) / 2);
      group.add(duvet);

      // Twin Pillows
      const pillowW = (matW - 0.2) / 2;
      const pillowD = 0.45;
      const pillowH = 0.12;
      const pillowGeo = new THREE.BoxGeometry(pillowW, pillowH, pillowD);
      const p1 = new THREE.Mesh(pillowGeo, accentMat);
      p1.position.set(-matW / 4, frameH + matH + pillowH / 2, -depth / 2 + headD + pillowD / 2 + 0.08);
      p1.rotation.x = -0.15;
      group.add(p1);

      const p2 = new THREE.Mesh(pillowGeo, accentMat);
      p2.position.set(matW / 4, frameH + matH + pillowH / 2, -depth / 2 + headD + pillowD / 2 + 0.08);
      p2.rotation.x = -0.15;
      group.add(p2);

      break;
    }

    case "bookshelf": {
      // Architectural open shelving unit
      const thickness = 0.03;
      // Outer box stiles
      const sideGeo = new THREE.BoxGeometry(thickness, height, depth);
      const sideL = new THREE.Mesh(sideGeo, woodMat);
      sideL.position.set(-width / 2 + thickness / 2, height / 2, 0);
      group.add(sideL);

      const sideR = new THREE.Mesh(sideGeo, woodMat);
      sideR.position.set(width / 2 - thickness / 2, height / 2, 0);
      group.add(sideR);

      // 5 Horizontal shelves
      const numShelves = 5;
      const shelfW = width - thickness * 2;
      const shelfGeo = new THREE.BoxGeometry(shelfW, thickness, depth);
      for (let i = 0; i < numShelves; i++) {
        const sy = (height / (numShelves - 1)) * i;
        const shelf = new THREE.Mesh(shelfGeo, woodMat);
        shelf.position.set(0, Math.max(thickness / 2, Math.min(height - thickness / 2, sy)), 0);
        shelf.castShadow = true;
        group.add(shelf);
      }

      // Colorful book blocks and ceramics
      const bookColors = ["#8B3A3A", "#2B4C6F", "#3B6E52", "#C28B38", "#4A3B32"];
      for (let s = 1; s < numShelves - 1; s++) {
        const sy = (height / (numShelves - 1)) * s + thickness / 2;
        const bookCount = 4 + (s % 3);
        for (let b = 0; b < bookCount; b++) {
          const bw = 0.03 + (b % 3) * 0.01;
          const bh = 0.22 + (b % 4) * 0.03;
          const bd = depth * 0.6;
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(bw, bh, bd),
            new THREE.MeshStandardMaterial({
              color: bookColors[(s + b) % bookColors.length],
              roughness: 0.6,
            })
          );
          book.position.set(-width * 0.3 + b * 0.05, sy + bh / 2, 0);
          group.add(book);
        }
      }

      break;
    }

    case "credenza": {
      // Fluted sideboard with tambour detail
      const legH = 0.16;
      const bodyH = height - legH;
      // Recessed metal frame legs
      const legFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.1, legH, depth - 0.1),
        metalMat
      );
      legFrame.position.set(0, legH / 2, 0);
      group.add(legFrame);

      // Main body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, bodyH, depth),
        woodMat
      );
      body.position.set(0, legH + bodyH / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Front fluted slats detail
      const slatCount = 20;
      const slatW = width / slatCount;
      const slatGeo = new THREE.CylinderGeometry(0.012, 0.012, bodyH * 0.94, 8);
      for (let i = 0; i < slatCount; i++) {
        const sx = -width / 2 + slatW / 2 + i * slatW;
        const slat = new THREE.Mesh(slatGeo, accentMat);
        slat.position.set(sx, legH + bodyH / 2, depth / 2 + 0.01);
        group.add(slat);
      }

      break;
    }

    case "work_desk": {
      // Cantilevered work desk
      const topH = 0.04;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(width, topH, depth),
        woodMat
      );
      top.position.set(0, height - topH / 2, 0);
      top.castShadow = true;
      group.add(top);

      // Thin architectural metal trestle legs
      const legGeo = new THREE.CylinderGeometry(0.018, 0.018, height - topH, 12);
      [
        [-width / 2 + 0.08, (height - topH) / 2, -depth / 2 + 0.08],
        [width / 2 - 0.08, (height - topH) / 2, -depth / 2 + 0.08],
        [-width / 2 + 0.08, (height - topH) / 2, depth / 2 - 0.08],
        [width / 2 - 0.08, (height - topH) / 2, depth / 2 - 0.08],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });

      // Desk pad & minimalist laptop
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.005, 0.4),
        new THREE.MeshStandardMaterial({ color: "#2B2D2F", roughness: 0.9 })
      );
      pad.position.set(0, height + 0.003, 0.02);
      group.add(pad);

      // Laptop
      const laptopBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.008, 0.2),
        metalMat
      );
      laptopBase.position.set(0, height + 0.008, 0.05);
      group.add(laptopBase);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.18, 0.006),
        metalMat
      );
      screen.position.set(0, height + 0.09, -0.05);
      screen.rotation.x = -0.2;
      group.add(screen);

      break;
    }

    case "floor_lamp": {
      // Archimede Arc Floor Lamp
      const baseR = 0.22;
      const baseH = 0.05;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(baseR, baseR, baseH, 32),
        new THREE.MeshStandardMaterial({ color: "#DFD9CE", roughness: 0.4 })
      );
      base.position.set(0, baseH / 2, -depth * 0.3);
      group.add(base);

      // Curved rod spline
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, baseH, -depth * 0.3),
        new THREE.Vector3(0, height * 0.6, -depth * 0.28),
        new THREE.Vector3(0, height * 0.95, -depth * 0.1),
        new THREE.Vector3(0, height, depth * 0.15),
        new THREE.Vector3(0, height * 0.85, depth * 0.3),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.015, 12, false);
      const tube = new THREE.Mesh(tubeGeo, metalMat);
      group.add(tube);

      // Lampshade dome
      const shadeGeo = new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const shade = new THREE.Mesh(
        shadeGeo,
        new THREE.MeshStandardMaterial({
          color: brassMat.color,
          roughness: 0.3,
          metalness: 0.8,
          side: THREE.DoubleSide,
        })
      );
      shade.position.set(0, height * 0.85, depth * 0.3);
      shade.rotation.x = Math.PI;
      group.add(shade);

      // Soft interior glowing point light
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 16, 16),
        new THREE.MeshBasicMaterial({ color: "#FFF3D1" })
      );
      bulb.position.set(0, height * 0.82, depth * 0.3);
      group.add(bulb);

      const lampLight = new THREE.PointLight("#FFEBB3", 0.9, 4, 1.8);
      lampLight.position.set(0, height * 0.78, depth * 0.3);
      group.add(lampLight);

      break;
    }

    case "potted_monstera": {
      // Ceramic planter
      const potH = 0.45;
      const potR = 0.24;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(potR, potR * 0.78, potH, 24),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.85 })
      );
      pot.position.set(0, potH / 2, 0);
      pot.castShadow = true;
      group.add(pot);

      // Soil bed
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(potR * 0.95, potR * 0.95, 0.04, 20),
        new THREE.MeshStandardMaterial({ color: "#3B2F2F", roughness: 0.95 })
      );
      soil.position.set(0, potH - 0.02, 0);
      group.add(soil);

      // Botanical Monstera Leaves
      const leafMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      const leafAngles = [0, 1.1, 2.2, 3.4, 4.5, 5.6];
      leafAngles.forEach((angle, i) => {
        const stemLength = 0.5 + (i % 3) * 0.15;
        const stemCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, potH, 0),
          new THREE.Vector3(
            Math.cos(angle) * 0.15,
            potH + stemLength * 0.6,
            Math.sin(angle) * 0.15
          ),
          new THREE.Vector3(
            Math.cos(angle) * 0.32,
            potH + stemLength,
            Math.sin(angle) * 0.32
          ),
        ]);
        const stem = new THREE.Mesh(
          new THREE.TubeGeometry(stemCurve, 12, 0.012, 8, false),
          leafMat
        );
        group.add(stem);

        // Broad fenestrated leaf shape
        const leafGeo = new THREE.PlaneGeometry(0.26, 0.38);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(
          Math.cos(angle) * 0.32,
          potH + stemLength,
          Math.sin(angle) * 0.32
        );
        leaf.rotation.set(-0.4, angle, 0.2);
        group.add(leaf);
      });

      break;
    }

    case "rug": {
      // Low-profile organic rug
      const rugGeo = new THREE.BoxGeometry(width, 0.015, depth);
      const rug = new THREE.Mesh(
        rugGeo,
        new THREE.MeshStandardMaterial({
          color: primaryColor,
          roughness: 0.95,
          metalness: 0.0,
        })
      );
      rug.position.set(0, 0.008, 0);
      rug.receiveShadow = true;
      group.add(rug);
      break;
    }

    case "ottoman": {
      // Pebble floor pouf
      const poufGeo = new THREE.SphereGeometry(width / 2, 24, 16);
      poufGeo.scale(1, height / width, depth / width);
      const pouf = new THREE.Mesh(poufGeo, fabricMat);
      pouf.position.set(0, height / 2, 0);
      pouf.castShadow = true;
      group.add(pouf);
      break;
    }

    case "wall_art": {
      // Minimalist canvas with float frame
      const frameThick = 0.025;
      const frameGeo = new THREE.BoxGeometry(width, height, frameThick);
      const frame = new THREE.Mesh(frameGeo, metalMat);
      frame.position.set(0, height / 2 + 0.8, 0);
      group.add(frame);

      const canvasGeo = new THREE.BoxGeometry(width - 0.06, height - 0.06, 0.015);
      const canvas = new THREE.Mesh(
        canvasGeo,
        new THREE.MeshStandardMaterial({
          color: primaryColor,
          roughness: 0.9,
        })
      );
      canvas.position.set(0, height / 2 + 0.8, frameThick / 2);
      group.add(canvas);
      break;
    }

    case "air_conditioner": {
      // Split inverter AC unit
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const acMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.35,
        metalness: 0.1,
      });
      const body = new THREE.Mesh(bodyGeo, acMat);
      body.position.set(0, height / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Bottom air output louver flap
      const louverGeo = new THREE.BoxGeometry(width - 0.08, 0.03, 0.04);
      const louver = new THREE.Mesh(louverGeo, metalMat);
      louver.position.set(0, 0.04, depth / 2 + 0.005);
      group.add(louver);

      // Digital LED display dot
      const ledGeo = new THREE.PlaneGeometry(0.04, 0.02);
      const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#00E5FF") });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(width / 2 - 0.12, height / 2, depth / 2 + 0.002);
      group.add(led);
      break;
    }

    case "refrigerator": {
      // French Door Refrigerator
      const fridgeMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.7,
      });
      // Main body
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const body = new THREE.Mesh(bodyGeo, fridgeMat);
      body.position.set(0, height / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Plinth base
      const plinthGeo = new THREE.BoxGeometry(width - 0.04, 0.08, depth - 0.04);
      const plinth = new THREE.Mesh(plinthGeo, metalMat);
      plinth.position.set(0, 0.04, 0);
      group.add(plinth);

      // Upper Door split divider line
      const splitGeo = new THREE.BoxGeometry(0.01, height * 0.58, 0.02);
      const split = new THREE.Mesh(splitGeo, metalMat);
      split.position.set(0, height * 0.68, depth / 2 + 0.005);
      group.add(split);

      // Handles (twin vertical bars)
      const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, height * 0.45, 12);
      const handleL = new THREE.Mesh(handleGeo, metalMat);
      handleL.position.set(-0.04, height * 0.68, depth / 2 + 0.04);
      const handleR = new THREE.Mesh(handleGeo, metalMat);
      handleR.position.set(0.04, height * 0.68, depth / 2 + 0.04);
      group.add(handleL);
      group.add(handleR);

      // Lower freezer drawer seam
      const drawerSeam = new THREE.BoxGeometry(width - 0.04, 0.015, 0.02);
      const seam = new THREE.Mesh(drawerSeam, metalMat);
      seam.position.set(0, height * 0.38, depth / 2 + 0.005);
      group.add(seam);

      // Freezer horizontal handle
      const fHandleGeo = new THREE.CylinderGeometry(0.012, 0.012, width * 0.6, 12);
      const fHandle = new THREE.Mesh(fHandleGeo, metalMat);
      fHandle.rotation.z = Math.PI / 2;
      fHandle.position.set(0, height * 0.35, depth / 2 + 0.04);
      group.add(fHandle);
      break;
    }

    case "ceiling_fan": {
      // Ceiling fan
      // Downrod
      const rodH = height * 0.6;
      const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, rodH, 12);
      const rod = new THREE.Mesh(rodGeo, metalMat);
      rod.position.set(0, height - rodH / 2, 0);
      group.add(rod);

      // Canopy cover on ceiling
      const canopyGeo = new THREE.ConeGeometry(0.08, 0.06, 16);
      const canopy = new THREE.Mesh(canopyGeo, metalMat);
      canopy.position.set(0, height - 0.03, 0);
      group.add(canopy);

      // Motor housing hub
      const hubH = height * 0.22;
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.22, hubH, 24);
      const hub = new THREE.Mesh(hubGeo, metalMat);
      hub.position.set(0, hubH / 2 + 0.06, 0);
      group.add(hub);

      // Integrated light dome
      const lightGeo = new THREE.SphereGeometry(0.14, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const lightMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#FFF5DD"),
        emissive: new THREE.Color("#FFE4A0"),
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const lightDome = new THREE.Mesh(lightGeo, lightMat);
      lightDome.position.set(0, 0.06, 0);
      group.add(lightDome);

      // 3 Blades
      const bladeLen = width * 0.44;
      const bladeGeo = new THREE.BoxGeometry(bladeLen, 0.012, 0.14);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.5,
        metalness: 0.1,
      });

      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = angle;
        bladePivot.position.set(0, hubH / 2 + 0.06, 0);

        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(bladeLen / 2 + 0.1, 0, 0);
        blade.rotation.x = 0.18; // Aerodynamic pitch tilt
        bladePivot.add(blade);
        group.add(bladePivot);
      }
      break;
    }

    case "smart_tv_unit": {
      // 65" TV on stylish media console
      const consoleH = 0.45;
      const consoleGeo = new THREE.BoxGeometry(width, consoleH, depth);
      const consoleMesh = new THREE.Mesh(consoleGeo, woodMat);
      consoleMesh.position.set(0, consoleH / 2, 0);
      consoleMesh.castShadow = true;
      group.add(consoleMesh);

      // Soundbar
      const soundGeo = new THREE.BoxGeometry(width * 0.55, 0.06, 0.08);
      const soundMesh = new THREE.Mesh(soundGeo, metalMat);
      soundMesh.position.set(0, consoleH + 0.03, depth * 0.2);
      group.add(soundMesh);

      // TV Stand Mount
      const standGeo = new THREE.BoxGeometry(0.35, 0.08, 0.25);
      const standMesh = new THREE.Mesh(standGeo, metalMat);
      standMesh.position.set(0, consoleH + 0.04, -depth * 0.1);
      group.add(standMesh);

      // TV Screen Bezel
      const tvW = width * 0.85;
      const tvH = height - consoleH - 0.1;
      const tvBezelGeo = new THREE.BoxGeometry(tvW, tvH, 0.025);
      const tvBezel = new THREE.Mesh(tvBezelGeo, metalMat);
      tvBezel.position.set(0, consoleH + 0.08 + tvH / 2, -depth * 0.1);
      tvBezel.castShadow = true;
      group.add(tvBezel);

      // TV OLED Panel (glossy dark with subtle blue reflections)
      const screenGeo = new THREE.PlaneGeometry(tvW - 0.02, tvH - 0.02);
      const screenMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#080A0F"),
        roughness: 0.1,
        metalness: 0.8,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, consoleH + 0.08 + tvH / 2, -depth * 0.1 + 0.014);
      group.add(screen);
      break;
    }

    case "washing_machine": {
      // Modern Front-Load Washer
      const washerMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.4,
        metalness: 0.2,
      });
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const body = new THREE.Mesh(bodyGeo, washerMat);
      body.position.set(0, height / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Circular Porthole Door Rim
      const doorRadius = Math.min(width, height) * 0.32;
      const rimGeo = new THREE.TorusGeometry(doorRadius, 0.025, 16, 32);
      const rim = new THREE.Mesh(rimGeo, metalMat);
      rim.position.set(0, height * 0.42, depth / 2 + 0.01);
      group.add(rim);

      // Tinted Door Glass
      const glassGeo = new THREE.CircleGeometry(doorRadius - 0.02, 32);
      const glassMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1B232A"),
        roughness: 0.1,
        metalness: 0.9,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, height * 0.42, depth / 2 + 0.015);
      group.add(glass);

      // Top control panel strip
      const dialGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20);
      const dial = new THREE.Mesh(dialGeo, metalMat);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(width * 0.15, height * 0.86, depth / 2 + 0.01);
      group.add(dial);

      const ledDisplay = new THREE.PlaneGeometry(0.12, 0.04);
      const ledM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#00E5FF") });
      const disp = new THREE.Mesh(ledDisplay, ledM);
      disp.position.set(width * 0.32, height * 0.86, depth / 2 + 0.005);
      group.add(disp);
      break;
    }

    case "microwave_oven": {
      // Countertop microwave
      const microMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.6,
      });
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const body = new THREE.Mesh(bodyGeo, microMat);
      body.position.set(0, height / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Glass door window
      const winW = width * 0.62;
      const winH = height * 0.72;
      const winGeo = new THREE.PlaneGeometry(winW, winH);
      const winMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0A0C10"),
        roughness: 0.15,
        metalness: 0.85,
      });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(-width * 0.14, height / 2, depth / 2 + 0.002);
      group.add(win);

      // Door Handle
      const hGeo = new THREE.CylinderGeometry(0.008, 0.008, winH * 0.75, 12);
      const handle = new THREE.Mesh(hGeo, metalMat);
      handle.position.set(winW / 2 - width * 0.16, height / 2, depth / 2 + 0.025);
      group.add(handle);
      break;
    }

    case "kitchen_island": {
      // Waterfall Quartz Kitchen Island with sink & faucet
      // Cabinet base
      const cabH = height - 0.06;
      const cabW = width - 0.1;
      const cabD = depth - 0.1;
      const cabGeo = new THREE.BoxGeometry(cabW, cabH, cabD);
      const cab = new THREE.Mesh(cabGeo, woodMat);
      cab.position.set(0, cabH / 2, 0);
      cab.castShadow = true;
      group.add(cab);

      // Waterfall Countertop
      const topMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.25,
        metalness: 0.1,
      });
      const topGeo = new THREE.BoxGeometry(width, 0.06, depth);
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.set(0, height - 0.03, 0);
      topMesh.castShadow = true;
      group.add(topMesh);

      // Undermount Sink basin
      const sinkGeo = new THREE.BoxGeometry(0.65, 0.22, 0.45);
      const sink = new THREE.Mesh(sinkGeo, metalMat);
      sink.position.set(width * 0.2, height - 0.12, 0);
      group.add(sink);

      // Gooseneck Faucet
      const faucetPipe = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 12);
      const faucet = new THREE.Mesh(faucetPipe, brassMat);
      faucet.position.set(width * 0.2, height + 0.18, -0.18);
      group.add(faucet);

      const archGeo = new THREE.TorusGeometry(0.08, 0.015, 12, 16, Math.PI);
      const arch = new THREE.Mesh(archGeo, brassMat);
      arch.rotation.z = Math.PI;
      arch.position.set(width * 0.2, height + 0.35, -0.18);
      group.add(arch);
      break;
    }

    case "gas_cooktop_hood": {
      // Range stove + overhead chimney hood
      const stoveH = 0.9;
      const stoveGeo = new THREE.BoxGeometry(width, stoveH, depth);
      const stoveMesh = new THREE.Mesh(stoveGeo, metalMat);
      stoveMesh.position.set(0, stoveH / 2, 0);
      stoveMesh.castShadow = true;
      group.add(stoveMesh);

      // Burner trivets on top
      const trivetMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#111111"), roughness: 0.8 });
      for (let bx = -1; bx <= 1; bx += 2) {
        for (let bz = -1; bz <= 1; bz += 2) {
          const tGeo = new THREE.TorusGeometry(0.08, 0.012, 8, 16);
          const trivet = new THREE.Mesh(tGeo, trivetMat);
          trivet.rotation.x = Math.PI / 2;
          trivet.position.set(bx * 0.25, stoveH + 0.015, bz * 0.18);
          group.add(trivet);
        }
      }

      // Overhead Extraction Hood
      const hoodBaseY = stoveH + 0.75;
      const hoodH = height - hoodBaseY;
      const canopyGeo = new THREE.ConeGeometry(width * 0.6, 0.22, 4);
      canopyGeo.rotateY(Math.PI / 4);
      const hoodCanopy = new THREE.Mesh(canopyGeo, metalMat);
      hoodCanopy.position.set(0, hoodBaseY + 0.11, 0);
      group.add(hoodCanopy);

      // Vertical Chimney Flue
      const flueGeo = new THREE.BoxGeometry(0.28, hoodH - 0.22, 0.28);
      const flue = new THREE.Mesh(flueGeo, metalMat);
      flue.position.set(0, hoodBaseY + 0.22 + (hoodH - 0.22) / 2, 0);
      group.add(flue);
      break;
    }

    case "bathtub": {
      // Sculptural freestanding oval bathtub
      const tubMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.15,
        metalness: 0.05,
      });
      // Outer shell
      const tubGeo = new THREE.CylinderGeometry(width / 2, width * 0.4, height, 32);
      tubGeo.scale(1, 1, depth / width);
      const tub = new THREE.Mesh(tubGeo, tubMat);
      tub.position.set(0, height / 2, 0);
      tub.castShadow = true;
      group.add(tub);

      // Inner hollow water basin
      const innerGeo = new THREE.CylinderGeometry(width * 0.44, width * 0.35, height - 0.06, 32);
      innerGeo.scale(1, 1, (depth * 0.85) / (width * 0.85));
      const waterMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#4895EF"),
        roughness: 0.05,
        metalness: 0.9,
      });
      const water = new THREE.Mesh(innerGeo, waterMat);
      water.position.set(0, height / 2 + 0.04, 0);
      group.add(water);

      // Floor-mount brass gooseneck faucet
      const fillerPipe = new THREE.CylinderGeometry(0.018, 0.018, height + 0.25, 16);
      const filler = new THREE.Mesh(fillerPipe, brassMat);
      filler.position.set(width / 2 + 0.08, (height + 0.25) / 2, 0);
      group.add(filler);
      break;
    }

    case "toilet_commode": {
      // Modern Dual-Flush Porcelain Toilet
      const ceramicMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.1,
        metalness: 0.05,
      });

      // Pedestal and bowl
      const bowlGeo = new THREE.CylinderGeometry(width * 0.45, width * 0.35, height * 0.52, 24);
      bowlGeo.scale(1, 1, 1.25);
      const bowl = new THREE.Mesh(bowlGeo, ceramicMat);
      bowl.position.set(0, (height * 0.52) / 2, depth * 0.1);
      bowl.castShadow = true;
      group.add(bowl);

      // Seat lid
      const lidGeo = new THREE.CylinderGeometry(width * 0.48, width * 0.48, 0.03, 24);
      lidGeo.scale(1, 1, 1.28);
      const lid = new THREE.Mesh(lidGeo, ceramicMat);
      lid.position.set(0, height * 0.52 + 0.015, depth * 0.1);
      group.add(lid);

      // Rear Cistern Tank
      const tankW = width;
      const tankH = height * 0.5;
      const tankD = depth * 0.36;
      const tankGeo = new THREE.BoxGeometry(tankW, tankH, tankD);
      const tank = new THREE.Mesh(tankGeo, ceramicMat);
      tank.position.set(0, height - tankH / 2, -depth / 2 + tankD / 2);
      tank.castShadow = true;
      group.add(tank);

      // Dual flush chrome buttons on top
      const btnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
      const btn = new THREE.Mesh(btnGeo, metalMat);
      btn.position.set(0, height + 0.006, -depth / 2 + tankD / 2);
      group.add(btn);
      break;
    }

    case "bathroom_vanity": {
      // Floating wood vanity cabinet + sink + illuminated mirror
      const cabH = height * 0.35;
      const cabGeo = new THREE.BoxGeometry(width, cabH, depth);
      const cab = new THREE.Mesh(cabGeo, woodMat);
      cab.position.set(0, height * 0.32, 0);
      cab.castShadow = true;
      group.add(cab);

      // White ceramic sink basin
      const basinMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#FFFFFF"), roughness: 0.1 });
      const basinGeo = new THREE.BoxGeometry(width * 0.6, 0.12, depth * 0.7);
      const basin = new THREE.Mesh(basinGeo, basinMat);
      basin.position.set(0, height * 0.32 + cabH / 2 + 0.06, 0);
      group.add(basin);

      // Faucet
      const fPipe = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12);
      const faucet = new THREE.Mesh(fPipe, metalMat);
      faucet.position.set(0, height * 0.32 + cabH / 2 + 0.17, -depth * 0.2);
      group.add(faucet);

      // Rectangular illuminated mirror above
      const mirW = width * 0.85;
      const mirH = height * 0.45;
      const mirFrame = new THREE.BoxGeometry(mirW, mirH, 0.025);
      const mirMesh = new THREE.Mesh(
        mirFrame,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color("#D8E4EC"),
          roughness: 0.05,
          metalness: 0.95,
        })
      );
      mirMesh.position.set(0, height * 0.75, -depth / 2 + 0.015);
      group.add(mirMesh);
      break;
    }

    case "shower_enclosure": {
      // Glass shower enclosure
      // Floor tray
      const trayGeo = new THREE.BoxGeometry(width, 0.05, depth);
      const trayMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#F3F3F5"), roughness: 0.4 });
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.set(0, 0.025, 0);
      group.add(tray);

      // Glass panels (subtle transparent cyan)
      const glassMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#A2D2FF"),
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        metalness: 0.1,
      });

      // Front glass wall
      const glassFrontGeo = new THREE.BoxGeometry(width, height - 0.05, 0.012);
      const glassFront = new THREE.Mesh(glassFrontGeo, glassMat);
      glassFront.position.set(0, height / 2 + 0.025, depth / 2 - 0.01);
      group.add(glassFront);

      // Side glass wall
      const glassSideGeo = new THREE.BoxGeometry(0.012, height - 0.05, depth);
      const glassSide = new THREE.Mesh(glassSideGeo, glassMat);
      glassSide.position.set(width / 2 - 0.01, height / 2 + 0.025, 0);
      group.add(glassSide);

      // Black minimal corner frame posts
      const postGeo = new THREE.CylinderGeometry(0.015, 0.015, height, 12);
      const post = new THREE.Mesh(postGeo, metalMat);
      post.position.set(width / 2 - 0.01, height / 2, depth / 2 - 0.01);
      group.add(post);

      // Overhead rainfall shower head
      const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 12);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0, height - 0.15, -depth / 2 + 0.2);
      group.add(arm);

      const headGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.018, 24);
      const head = new THREE.Mesh(headGeo, metalMat);
      head.position.set(0, height - 0.17, -depth / 2 + 0.35);
      group.add(head);
      break;
    }

    case "sectional_sofa": {
      // L-shaped Chaise Sectional Sofa
      const legH = 0.1;
      const seatH = 0.35;
      const sofaW = width * 0.65;
      const chaiseW = width * 0.35;

      // Main seat block
      const mainSeatGeo = new THREE.BoxGeometry(sofaW, seatH, depth * 0.55);
      const mainSeat = new THREE.Mesh(mainSeatGeo, fabricMat);
      mainSeat.position.set(-width / 2 + sofaW / 2, legH + seatH / 2, depth * 0.18);
      mainSeat.castShadow = true;
      group.add(mainSeat);

      // Chaise extension block
      const chaiseGeo = new THREE.BoxGeometry(chaiseW, seatH, depth);
      const chaise = new THREE.Mesh(chaiseGeo, fabricMat);
      chaise.position.set(width / 2 - chaiseW / 2, legH + seatH / 2, 0);
      chaise.castShadow = true;
      group.add(chaise);

      // Backrest
      const backH = height - (legH + seatH);
      const backGeo = new THREE.BoxGeometry(width, backH, 0.22);
      const backMesh = new THREE.Mesh(backGeo, fabricMat);
      backMesh.position.set(0, legH + seatH + backH / 2, -depth / 2 + 0.11);
      backMesh.castShadow = true;
      group.add(backMesh);
      break;
    }

    case "wardrobe_closet": {
      // Grand Sliding Door Wardrobe
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const body = new THREE.Mesh(bodyGeo, woodMat);
      body.position.set(0, height / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Split sliding doors line
      const lineGeo = new THREE.BoxGeometry(0.01, height - 0.1, 0.02);
      const line = new THREE.Mesh(lineGeo, metalMat);
      line.position.set(0, height / 2, depth / 2 + 0.005);
      group.add(line);

      // Recessed brass handle tracks
      const hTrackGeo = new THREE.BoxGeometry(0.02, height * 0.45, 0.01);
      const hL = new THREE.Mesh(hTrackGeo, brassMat);
      hL.position.set(-0.06, height / 2, depth / 2 + 0.008);
      const hR = new THREE.Mesh(hTrackGeo, brassMat);
      hR.position.set(0.06, height / 2, depth / 2 + 0.008);
      group.add(hL);
      group.add(hR);
      break;
    }

    case "nightstand": {
      // Bedside Nightstand + lamp
      const tableH = height * 0.65;
      const tableGeo = new THREE.BoxGeometry(width, tableH, depth);
      const table = new THREE.Mesh(tableGeo, woodMat);
      table.position.set(0, tableH / 2, 0);
      table.castShadow = true;
      group.add(table);

      // Drawer handle knob
      const knobGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12);
      const knob = new THREE.Mesh(knobGeo, brassMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0, tableH * 0.65, depth / 2 + 0.01);
      group.add(knob);

      // Small Table Lamp on top
      const lampBaseGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.08, 16);
      const lampBase = new THREE.Mesh(lampBaseGeo, metalMat);
      lampBase.position.set(0, tableH + 0.04, 0);
      group.add(lampBase);

      const shadeGeo = new THREE.ConeGeometry(0.12, 0.14, 16, 1, true);
      const shadeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#FFF2D4"),
        emissive: new THREE.Color("#FFE0A0"),
        emissiveIntensity: 0.5,
        roughness: 0.3,
      });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(0, tableH + 0.18, 0);
      group.add(shade);
      break;
    }

    case "soundbar_system": {
      // Sleek Soundbar Bar
      const barH = 0.08;
      const barD = 0.12;
      const barW = width * 0.72;
      const barGeo = new THREE.BoxGeometry(barW, barH, barD);
      const soundbarMesh = new THREE.Mesh(barGeo, metalMat);
      soundbarMesh.position.set(-width * 0.12, barH / 2, 0);
      soundbarMesh.castShadow = true;
      group.add(soundbarMesh);

      // Acoustic Fabric Grille
      const grilleGeo = new THREE.BoxGeometry(barW - 0.04, barH - 0.02, 0.01);
      const grilleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#18181B"),
        roughness: 0.9,
      });
      const grille = new THREE.Mesh(grilleGeo, grilleMat);
      grille.position.set(-width * 0.12, barH / 2, barD / 2 + 0.005);
      group.add(grille);

      // Status LED
      const ledGeo = new THREE.BoxGeometry(0.01, 0.004, 0.002);
      const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#38BDF8") });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(-width * 0.12, barH / 2, barD / 2 + 0.012);
      group.add(led);

      // Dedicated Wireless Subwoofer Cabinet
      const subW = width * 0.22;
      const subH = height;
      const subD = depth * 0.85;
      const subGeo = new THREE.BoxGeometry(subW, subH, subD);
      const subMesh = new THREE.Mesh(subGeo, metalMat);
      subMesh.position.set(width / 2 - subW / 2, subH / 2, 0);
      subMesh.castShadow = true;
      group.add(subMesh);

      // Subwoofer Port / Bass Cone
      const portGeo = new THREE.CylinderGeometry(subW * 0.28, subW * 0.28, 0.01, 24);
      const portMesh = new THREE.Mesh(portGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color("#09090B") }));
      portMesh.rotation.x = Math.PI / 2;
      portMesh.position.set(width / 2 - subW / 2, subH * 0.5, subD / 2 + 0.005);
      group.add(portMesh);
      break;
    }

    case "gaming_workstation": {
      // Desk Base Platform
      const deskTopH = 0.05;
      const deskY = height * 0.55;
      const deskTopGeo = new THREE.BoxGeometry(width, deskTopH, depth);
      const deskTop = new THREE.Mesh(deskTopGeo, woodMat);
      deskTop.position.set(0, deskY, 0);
      deskTop.castShadow = true;
      group.add(deskTop);

      // Metal T-legs
      const legGeo = new THREE.BoxGeometry(0.06, deskY, depth * 0.8);
      const leftLeg = new THREE.Mesh(legGeo, metalMat);
      leftLeg.position.set(-width / 2 + 0.08, deskY / 2, 0);
      const rightLeg = new THREE.Mesh(legGeo, metalMat);
      rightLeg.position.set(width / 2 - 0.08, deskY / 2, 0);
      group.add(leftLeg);
      group.add(rightLeg);

      // Dual Curved Monitors
      const monW = width * 0.42;
      const monH = height * 0.38;
      const monGeo = new THREE.BoxGeometry(monW, monH, 0.03);
      const screenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1E293B") });

      const leftMon = new THREE.Mesh(monGeo, screenMat);
      leftMon.position.set(-monW / 2 - 0.02, deskY + deskTopH / 2 + monH / 2 + 0.08, -0.05);
      leftMon.rotation.y = 0.12;
      group.add(leftMon);

      const rightMon = new THREE.Mesh(monGeo, screenMat);
      rightMon.position.set(monW / 2 + 0.02, deskY + deskTopH / 2 + monH / 2 + 0.08, -0.05);
      rightMon.rotation.y = -0.12;
      group.add(rightMon);

      // Dual Monitor Stand Arms
      const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12);
      const armL = new THREE.Mesh(armGeo, metalMat);
      armL.position.set(-monW / 2 - 0.02, deskY + 0.11, -0.08);
      const armR = new THREE.Mesh(armGeo, metalMat);
      armR.position.set(monW / 2 + 0.02, deskY + 0.11, -0.08);
      group.add(armL);
      group.add(armR);

      // RGB Desktop PC Tower
      const towerW = 0.22;
      const towerH = 0.45;
      const towerD = 0.42;
      const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
      const towerMesh = new THREE.Mesh(towerGeo, metalMat);
      towerMesh.position.set(width / 2 - towerW / 2 - 0.04, deskY + deskTopH / 2 + towerH / 2, 0.02);
      group.add(towerMesh);

      // RGB Accent Strip
      const rgbGeo = new THREE.BoxGeometry(0.01, towerH * 0.8, 0.01);
      const rgbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#A855F7") });
      const rgb = new THREE.Mesh(rgbGeo, rgbMat);
      rgb.position.set(width / 2 - towerW - 0.045, deskY + deskTopH / 2 + towerH / 2, towerD / 2);
      group.add(rgb);

      // Desk Mat + Keyboard + Mouse
      const matGeo = new THREE.BoxGeometry(width * 0.65, 0.005, depth * 0.4);
      const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color("#27272A"), roughness: 0.9 }));
      matMesh.position.set(-0.08, deskY + deskTopH / 2 + 0.003, 0.1);
      group.add(matMesh);

      const kbGeo = new THREE.BoxGeometry(0.38, 0.012, 0.14);
      const kbMesh = new THREE.Mesh(kbGeo, metalMat);
      kbMesh.position.set(-0.12, deskY + deskTopH / 2 + 0.01, 0.12);
      group.add(kbMesh);

      const mouseGeo = new THREE.BoxGeometry(0.06, 0.02, 0.1);
      const mouseMesh = new THREE.Mesh(mouseGeo, metalMat);
      mouseMesh.position.set(0.18, deskY + deskTopH / 2 + 0.012, 0.12);
      group.add(mouseMesh);
      break;
    }

    case "air_purifier": {
      // Cylindrical Tower Air Purifier
      const bodyRadius = width * 0.45;
      const bodyGeo = new THREE.CylinderGeometry(bodyRadius * 0.92, bodyRadius, height, 32);
      const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
      bodyMesh.position.set(0, height / 2, 0);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Top Air Exhaust Vent Ring
      const ventGeo = new THREE.CylinderGeometry(bodyRadius * 0.88, bodyRadius * 0.88, 0.02, 32);
      const ventMesh = new THREE.Mesh(ventGeo, metalMat);
      ventMesh.position.set(0, height + 0.01, 0);
      group.add(ventMesh);

      // Glowing Ambient Air Quality Ring & OLED Display
      const glowGeo = new THREE.TorusGeometry(bodyRadius * 0.8, 0.015, 16, 32);
      const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#10B981") });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.rotation.x = Math.PI / 2;
      glowMesh.position.set(0, height + 0.015, 0);
      group.add(glowMesh);

      // Front OLED status screen
      const oledGeo = new THREE.CircleGeometry(0.05, 24);
      const oledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#0F172A") });
      const oled = new THREE.Mesh(oledGeo, oledMat);
      oled.position.set(0, height * 0.75, bodyRadius * 0.93 + 0.002);
      group.add(oled);
      break;
    }

    case "coffee_espresso_bar": {
      // Counter Base
      const bodyGeo = new THREE.BoxGeometry(width, height * 0.85, depth);
      const bodyMesh = new THREE.Mesh(bodyGeo, metalMat);
      bodyMesh.position.set(0, (height * 0.85) / 2, 0);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Stainless Steel Drip Tray
      const trayGeo = new THREE.BoxGeometry(width * 0.9, 0.04, depth * 0.35);
      const trayMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#CBD5E1"),
        roughness: 0.2,
        metalness: 0.9,
      });
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.set(0, 0.02, depth * 0.32);
      group.add(tray);

      // Dual Brass Group Heads
      const groupGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
      const group1 = new THREE.Mesh(groupGeo, brassMat);
      group1.position.set(-width * 0.22, height * 0.5, depth * 0.28);
      const group2 = new THREE.Mesh(groupGeo, brassMat);
      group2.position.set(width * 0.22, height * 0.5, depth * 0.28);
      group.add(group1);
      group.add(group2);

      // Portafilter Handles
      const pfGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 12);
      const pf1 = new THREE.Mesh(pfGeo, woodMat);
      pf1.rotation.x = Math.PI / 2;
      pf1.position.set(-width * 0.22, height * 0.48, depth * 0.38);
      const pf2 = new THREE.Mesh(pfGeo, woodMat);
      pf2.rotation.x = Math.PI / 2;
      pf2.position.set(width * 0.22, height * 0.48, depth * 0.38);
      group.add(pf1);
      group.add(pf2);

      // Bean Hopper Top Jars
      const hopGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.18, 16);
      const hopMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#475569"),
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
      });
      const hop1 = new THREE.Mesh(hopGeo, hopMat);
      hop1.position.set(-width * 0.24, height * 0.95, -depth * 0.15);
      const hop2 = new THREE.Mesh(hopGeo, hopMat);
      hop2.position.set(width * 0.24, height * 0.95, -depth * 0.15);
      group.add(hop1);
      group.add(hop2);
      break;
    }

    case "ergonomic_office_chair": {
      // 5-Star Caster Base
      const baseRadius = width * 0.48;
      const centerColumnGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.38, 16);
      const centerColumn = new THREE.Mesh(centerColumnGeo, metalMat);
      centerColumn.position.set(0, 0.19, 0);
      group.add(centerColumn);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const legBarGeo = new THREE.BoxGeometry(0.03, 0.02, baseRadius);
        const legBar = new THREE.Mesh(legBarGeo, metalMat);
        legBar.position.set((baseRadius / 2) * Math.sin(ang), 0.05, (baseRadius / 2) * Math.cos(ang));
        legBar.rotation.y = ang;
        group.add(legBar);

        // Wheel Caster
        const wheelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12);
        const wheel = new THREE.Mesh(wheelGeo, metalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(baseRadius * Math.sin(ang), 0.025, baseRadius * Math.cos(ang));
        group.add(wheel);
      }

      // Seat Cushion
      const seatH = 0.08;
      const seatY = 0.45;
      const seatGeo = new THREE.BoxGeometry(width * 0.85, seatH, depth * 0.8);
      const seat = new THREE.Mesh(seatGeo, fabricMat);
      seat.position.set(0, seatY + seatH / 2, 0.02);
      seat.castShadow = true;
      group.add(seat);

      // Ergonomic Curved Mesh Backrest
      const backH = height - seatY - 0.08;
      const backGeo = new THREE.BoxGeometry(width * 0.78, backH, 0.04);
      const backMesh = new THREE.Mesh(backGeo, fabricMat);
      backMesh.position.set(0, seatY + seatH + backH / 2, -depth * 0.35);
      backMesh.rotation.x = -0.08;
      backMesh.castShadow = true;
      group.add(backMesh);

      // Lumbar Support Bar
      const lumbarGeo = new THREE.BoxGeometry(width * 0.7, 0.08, 0.03);
      const lumbar = new THREE.Mesh(lumbarGeo, metalMat);
      lumbar.position.set(0, seatY + seatH + backH * 0.35, -depth * 0.33);
      group.add(lumbar);

      // Adjustable Armrests
      const armPostGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);
      const armPadGeo = new THREE.BoxGeometry(0.08, 0.03, 0.24);

      const postL = new THREE.Mesh(armPostGeo, metalMat);
      postL.position.set(-width * 0.44, seatY + 0.12, 0);
      const padL = new THREE.Mesh(armPadGeo, metalMat);
      padL.position.set(-width * 0.44, seatY + 0.24, 0);
      group.add(postL);
      group.add(padL);

      const postR = new THREE.Mesh(armPostGeo, metalMat);
      postR.position.set(width * 0.44, seatY + 0.12, 0);
      const padR = new THREE.Mesh(armPadGeo, metalMat);
      padR.position.set(width * 0.44, seatY + 0.24, 0);
      group.add(postR);
      group.add(padR);
      break;
    }

    case "bar_stools": {
      // Pair of Scandinavian Counter Bar Stools
      const stoolW = width * 0.42;
      const stoolH = height;
      const offsets = [-width * 0.26, width * 0.26];

      offsets.forEach((sx) => {
        // Sculpted Saddle Seat
        const seatGeo = new THREE.CylinderGeometry(stoolW * 0.48, stoolW * 0.45, 0.05, 24);
        const seatMesh = new THREE.Mesh(seatGeo, woodMat);
        seatMesh.position.set(sx, stoolH, 0);
        seatMesh.castShadow = true;
        group.add(seatMesh);

        // 4 Tapered Metal Legs
        const legR = stoolW * 0.38;
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const legGeo = new THREE.CylinderGeometry(0.014, 0.02, stoolH, 12);
          const leg = new THREE.Mesh(legGeo, metalMat);
          leg.position.set(sx + (legR / 2) * Math.sin(ang), stoolH / 2, (legR / 2) * Math.cos(ang));
          leg.rotation.z = Math.sin(ang) * -0.06;
          leg.rotation.x = Math.cos(ang) * 0.06;
          leg.castShadow = true;
          group.add(leg);
        }

        // Circular Footrest Ring
        const ringGeo = new THREE.TorusGeometry(legR * 0.85, 0.012, 12, 24);
        const footRing = new THREE.Mesh(ringGeo, brassMat);
        footRing.rotation.x = Math.PI / 2;
        footRing.position.set(sx, stoolH * 0.32, 0);
        group.add(footRing);
      });
      break;
    }

    case "king_bed_deluxe": {
      // Luxury King Bed with Upholstered Tufted Headboard & Dual Nightstands
      const frameH = 0.28;
      const frameGeo = new THREE.BoxGeometry(width, frameH, depth);
      const frame = new THREE.Mesh(frameGeo, woodMat);
      frame.position.set(0, frameH / 2, 0);
      frame.castShadow = true;
      group.add(frame);

      // Deep Tufted Headboard
      const headH = height;
      const headGeo = new THREE.BoxGeometry(width + 0.1, headH, 0.14);
      const headMesh = new THREE.Mesh(headGeo, fabricMat);
      headMesh.position.set(0, headH / 2, -depth / 2 + 0.07);
      headMesh.castShadow = true;
      group.add(headMesh);

      // King Mattress
      const matW = width - 0.1;
      const matL = depth - 0.2;
      const matH = 0.28;
      const matGeo = new THREE.BoxGeometry(matW, matH, matL);
      const mattress = new THREE.Mesh(matGeo, fabricMat);
      mattress.position.set(0, frameH + matH / 2, 0.06);
      group.add(mattress);

      // Folded Luxury Duvet
      const duvetGeo = new THREE.BoxGeometry(matW + 0.04, 0.08, matL * 0.68);
      const duvet = new THREE.Mesh(duvetGeo, accentMat);
      duvet.position.set(0, frameH + matH + 0.04, 0.2);
      duvet.castShadow = true;
      group.add(duvet);

      // Four Fluffy Sleeping Pillows
      const pW = (matW - 0.16) / 2;
      const pL = 0.42;
      const pH = 0.12;
      const pGeo = new THREE.BoxGeometry(pW, pH, pL);
      const pMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#FAF5EE"), roughness: 0.9 });

      const p1 = new THREE.Mesh(pGeo, pMat);
      p1.position.set(-pW / 2 - 0.04, frameH + matH + pH / 2, -depth / 2 + 0.38);
      p1.rotation.x = 0.2;
      const p2 = new THREE.Mesh(pGeo, pMat);
      p2.position.set(pW / 2 + 0.04, frameH + matH + pH / 2, -depth / 2 + 0.38);
      p2.rotation.x = 0.2;
      group.add(p1);
      group.add(p2);
      break;
    }

    case "round_marble_table": {
      // Sculpted Pedestal Base + Round Marble Top
      const topR = width / 2;
      const topH = 0.04;
      const topGeo = new THREE.CylinderGeometry(topR, topR, topH, 48);
      const marbleMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.2,
        metalness: 0.1,
      });
      const topMesh = new THREE.Mesh(topGeo, marbleMat);
      topMesh.position.set(0, height - topH / 2, 0);
      topMesh.castShadow = true;
      group.add(topMesh);

      // Fluted Conical Pedestal
      const pedGeo = new THREE.CylinderGeometry(0.12, width * 0.28, height - topH, 32);
      const pedestal = new THREE.Mesh(pedGeo, woodMat);
      pedestal.position.set(0, (height - topH) / 2, 0);
      pedestal.castShadow = true;
      group.add(pedestal);

      // Polished Brass Base Ring
      const ringGeo = new THREE.CylinderGeometry(width * 0.3, width * 0.3, 0.02, 32);
      const ring = new THREE.Mesh(ringGeo, brassMat);
      ring.position.set(0, 0.01, 0);
      group.add(ring);
      break;
    }

    case "pendant_chandelier": {
      // Sculptural Sputnik / Grand Aurora Chandelier with glowing globes
      const rodH = Math.max(0.3, height * 0.4);
      const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, rodH, 16);
      const rod = new THREE.Mesh(rodGeo, brassMat);
      rod.position.set(0, height - rodH / 2, 0);
      group.add(rod);

      // Central Brass Hub
      const hubGeo = new THREE.SphereGeometry(0.08, 24, 24);
      const hub = new THREE.Mesh(hubGeo, brassMat);
      const hubY = height - rodH;
      hub.position.set(0, hubY, 0);
      group.add(hub);

      // Glowing Globe Material
      const globeMat = new THREE.MeshStandardMaterial({
        color: "#FFFBF0",
        emissive: "#FFE5B4",
        emissiveIntensity: 0.85,
        roughness: 0.15,
      });

      // 6 Radial Branches with Glowing Globes
      const branchCount = 6;
      const armR = Math.min(width, depth) * 0.42;
      for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * Math.PI * 2;
        const pitch = (i % 2 === 0 ? 0.15 : -0.15);
        const armEndX = Math.cos(angle) * armR;
        const armEndZ = Math.sin(angle) * armR;
        const armEndY = hubY + Math.sin(pitch) * (armR * 0.35);

        // Branch rod
        const armGeo = new THREE.CylinderGeometry(0.008, 0.008, armR, 12);
        const arm = new THREE.Mesh(armGeo, brassMat);
        arm.position.set(armEndX / 2, (hubY + armEndY) / 2, armEndZ / 2);
        arm.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(armEndX, armEndY - hubY, armEndZ).normalize()
        );
        group.add(arm);

        // Globe
        const globeGeo = new THREE.SphereGeometry(0.09, 20, 20);
        const globe = new THREE.Mesh(globeGeo, globeMat);
        globe.position.set(armEndX, armEndY, armEndZ);
        group.add(globe);
      }
      break;
    }

    case "table_lamp": {
      // Sculptural Ceramic Lamp + Pleated Linen Shade
      const baseH = height * 0.45;
      const baseR = width * 0.35;
      const baseGeo = new THREE.CylinderGeometry(baseR * 0.6, baseR, baseH, 28);
      const baseMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.45,
        metalness: 0.05,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(0, baseH / 2, 0);
      base.castShadow = true;
      group.add(base);

      // Brass Neck
      const neckH = height * 0.1;
      const neckGeo = new THREE.CylinderGeometry(0.015, 0.015, neckH, 16);
      const neck = new THREE.Mesh(neckGeo, brassMat);
      neck.position.set(0, baseH + neckH / 2, 0);
      group.add(neck);

      // Linen Drum Shade with warm emissive interior
      const shadeH = height * 0.45;
      const shadeTopR = width * 0.32;
      const shadeBotR = width * 0.45;
      const shadeGeo = new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 32, 1, true);
      const shadeMat = new THREE.MeshStandardMaterial({
        color: "#FAF8F5",
        emissive: "#FFF2D1",
        emissiveIntensity: 0.4,
        roughness: 0.8,
        side: THREE.DoubleSide,
      });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(0, baseH + neckH + shadeH / 2, 0);
      shade.castShadow = true;
      group.add(shade);

      // Finial
      const finialGeo = new THREE.SphereGeometry(0.02, 16, 16);
      const finial = new THREE.Mesh(finialGeo, brassMat);
      finial.position.set(0, baseH + neckH + shadeH + 0.02, 0);
      group.add(finial);
      break;
    }

    case "wall_sconce": {
      // Architectural Dual-Beam Wall Sconce
      const backH = height * 0.5;
      const backGeo = new THREE.BoxGeometry(width * 0.7, backH, 0.02);
      const back = new THREE.Mesh(backGeo, brassMat);
      back.position.set(0, height / 2, -depth / 2 + 0.01);
      group.add(back);

      // Fluted Cylindrical Light Tube
      const tubeH = height * 0.88;
      const tubeR = width * 0.35;
      const tubeGeo = new THREE.CylinderGeometry(tubeR, tubeR, tubeH, 24);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.6,
      });
      const tube = new THREE.Mesh(tubeGeo, bodyMat);
      tube.position.set(0, height / 2, 0);
      tube.castShadow = true;
      group.add(tube);

      // Glowing Top and Bottom Diffusers
      const glowMat = new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        emissive: "#FFEFC4",
        emissiveIntensity: 1.0,
        roughness: 0.2,
      });
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(tubeR * 0.95, tubeR * 0.95, 0.03, 24), glowMat);
      topCap.position.set(0, height / 2 + tubeH / 2, 0);
      group.add(topCap);

      const botCap = new THREE.Mesh(new THREE.CylinderGeometry(tubeR * 0.95, tubeR * 0.95, 0.03, 24), glowMat);
      botCap.position.set(0, height / 2 - tubeH / 2, 0);
      group.add(botCap);
      break;
    }

    case "dresser_drawers": {
      // 6-Drawer Fluted Mid-Century Dresser
      const legH = height * 0.2;
      const bodyH = height - legH;

      // Main Cabinet Carcass
      const bodyGeo = new THREE.BoxGeometry(width, bodyH, depth);
      const body = new THREE.Mesh(bodyGeo, woodMat);
      body.position.set(0, legH + bodyH / 2, 0);
      body.castShadow = true;
      group.add(body);

      // 6 Drawer Fronts (2 cols x 3 rows)
      const cols = 2;
      const rows = 3;
      const gap = 0.015;
      const dW = (width - gap * 3) / cols;
      const dH = (bodyH - gap * 4) / rows;
      const drawerMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.45,
        metalness: 0.05,
      });

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = -width / 2 + gap + dW / 2 + c * (dW + gap);
          const dy = legH + gap + dH / 2 + r * (dH + gap);

          const dFront = new THREE.Mesh(new THREE.BoxGeometry(dW, dH, 0.015), drawerMat);
          dFront.position.set(dx, dy, depth / 2 + 0.008);
          dFront.castShadow = true;
          group.add(dFront);

          // Brass Knob Handle
          const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16), brassMat);
          knob.rotation.x = Math.PI / 2;
          knob.position.set(dx, dy, depth / 2 + 0.022);
          group.add(knob);
        }
      }

      // 4 Tapered Legs with Brass Ferrules
      const legPositions = [
        [-width / 2 + 0.08, -depth / 2 + 0.08],
        [width / 2 - 0.08, -depth / 2 + 0.08],
        [-width / 2 + 0.08, depth / 2 - 0.08],
        [width / 2 - 0.08, depth / 2 - 0.08],
      ];
      legPositions.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.castShadow = true;
        group.add(leg);

        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.03, 16), brassMat);
        tip.position.set(lx, 0.015, lz);
        group.add(tip);
      });
      break;
    }

    case "wall_clock": {
      // Minimalist Nordic Round Wall Clock
      const radius = width / 2;
      const rimThick = 0.025;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, rimThick, 16, 48), woodMat);
      rim.position.set(0, height / 2, 0);
      group.add(rim);

      // Dial Face
      const dialGeo = new THREE.CylinderGeometry(radius - rimThick, radius - rimThick, 0.015, 48);
      const dialMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.5,
        metalness: 0.05,
      });
      const dial = new THREE.Mesh(dialGeo, dialMat);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0, height / 2, 0);
      dial.castShadow = true;
      group.add(dial);

      // Center Brass Hub
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 24), brassMat);
      center.rotation.x = Math.PI / 2;
      center.position.set(0, height / 2, 0.012);
      group.add(center);

      // Hour Hand (Pointing roughly to 10:10)
      const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.008, radius * 0.5, 0.004), metalMat);
      hHand.position.set(-radius * 0.18, height / 2 + radius * 0.18, 0.015);
      hHand.rotation.z = -Math.PI / 3;
      group.add(hHand);

      // Minute Hand
      const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.006, radius * 0.72, 0.004), metalMat);
      mHand.position.set(radius * 0.22, height / 2 + radius * 0.22, 0.018);
      mHand.rotation.z = Math.PI / 6;
      group.add(mHand);
      break;
    }

    case "fiddle_leaf_fig": {
      // Tall Potted Fiddle Leaf Fig Botanical Plant
      const potH = height * 0.32;
      const potR = width * 0.28;
      const potGeo = new THREE.CylinderGeometry(potR, potR * 0.75, potH, 32);
      const potMat = new THREE.MeshStandardMaterial({
        color: "#EDE8E1",
        roughness: 0.6,
        metalness: 0.02,
      });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(0, potH / 2, 0);
      pot.castShadow = true;
      group.add(pot);

      // Soil Plane
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(potR * 0.95, potR * 0.95, 0.02, 24),
        new THREE.MeshStandardMaterial({ color: "#2E241E", roughness: 0.9 })
      );
      soil.position.set(0, potH - 0.01, 0);
      group.add(soil);

      // Woody Trunk with slight natural curve
      const trunkH = height * 0.65;
      const trunkGeo = new THREE.CylinderGeometry(0.018, 0.028, trunkH, 16);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.set(0, potH + trunkH / 2, 0);
      trunk.castShadow = true;
      group.add(trunk);

      // Broad Sculpted Fiddle Leaves in Natural Spiral
      const leafMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const leafCount = 9;
      for (let i = 0; i < leafCount; i++) {
        const frac = (i + 1) / (leafCount + 1);
        const ly = potH + trunkH * (0.35 + frac * 0.62);
        const rot = i * 1.8;
        const leafW = width * 0.34;
        const leafH = width * 0.44;

        const leafGeo = new THREE.SphereGeometry(leafW, 12, 12);
        leafGeo.scale(1, 0.06, 1.4);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(
          Math.cos(rot) * (width * 0.22),
          ly,
          Math.sin(rot) * (width * 0.22)
        );
        leaf.rotation.set(0.3, rot, 0.2);
        leaf.castShadow = true;
        group.add(leaf);
      }
      break;
    }

    case "loveseat_sofa": {
      // Curved Organic Bouclé 2-Seater Loveseat
      const seatH = height * 0.44;
      const baseGeo = new THREE.BoxGeometry(width * 0.96, seatH, depth * 0.92);
      const base = new THREE.Mesh(baseGeo, fabricMat);
      base.position.set(0, seatH / 2, 0);
      base.castShadow = true;
      group.add(base);

      // Dual Plush Seat Cushions
      const cW = (width * 0.92) / 2;
      const cGeo = new THREE.BoxGeometry(cW - 0.02, 0.12, depth * 0.68);
      const c1 = new THREE.Mesh(cGeo, fabricMat);
      c1.position.set(-cW / 2 - 0.01, seatH + 0.06, 0.06);
      c1.castShadow = true;
      const c2 = new THREE.Mesh(cGeo, fabricMat);
      c2.position.set(cW / 2 + 0.01, seatH + 0.06, 0.06);
      c2.castShadow = true;
      group.add(c1);
      group.add(c2);

      // Curved Cocoon Backrest
      const backH = height - seatH;
      const backGeo = new THREE.CylinderGeometry(width * 0.48, width * 0.48, backH, 32, 1, false, 0, Math.PI);
      const backrest = new THREE.Mesh(backGeo, fabricMat);
      backrest.rotation.y = Math.PI;
      backrest.position.set(0, seatH + backH / 2, 0);
      backrest.castShadow = true;
      group.add(backrest);

      // Accent Lumbar Pillows
      const pGeo = new THREE.BoxGeometry(0.38, 0.24, 0.1);
      const pMat = new THREE.MeshStandardMaterial({ color: "#D4C8B8", roughness: 0.8 });
      const p1 = new THREE.Mesh(pGeo, pMat);
      p1.position.set(-cW / 2, seatH + 0.18, -depth * 0.18);
      p1.rotation.y = 0.15;
      const p2 = new THREE.Mesh(pGeo, pMat);
      p2.position.set(cW / 2, seatH + 0.18, -depth * 0.18);
      p2.rotation.y = -0.15;
      group.add(p1);
      group.add(p2);
      break;
    }

    case "shoe_rack": {
      // Slatted Oak Entryway Shoe Bench
      const benchTopH = 0.035;
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(width, benchTopH, depth), woodMat);
      benchSeat.position.set(0, height - benchTopH / 2, 0);
      benchSeat.castShadow = true;
      group.add(benchSeat);

      // 4 Steel Corner Posts
      const postGeo = new THREE.CylinderGeometry(0.014, 0.014, height, 16);
      const postOffsets = [
        [-width / 2 + 0.03, -depth / 2 + 0.03],
        [width / 2 - 0.03, -depth / 2 + 0.03],
        [-width / 2 + 0.03, depth / 2 - 0.03],
        [width / 2 - 0.03, depth / 2 - 0.03],
      ];
      postOffsets.forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.set(px, height / 2, pz);
        group.add(post);
      });

      // 2 Slatted Steel Shelf Tiers
      const tierYs = [height * 0.32, height * 0.62];
      tierYs.forEach((ty) => {
        const slatCount = 5;
        for (let s = 0; s < slatCount; s++) {
          const sz = -depth / 2 + 0.06 + (s / (slatCount - 1)) * (depth - 0.12);
          const slat = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, width - 0.06, 12), metalMat);
          slat.rotation.z = Math.PI / 2;
          slat.position.set(0, ty, sz);
          group.add(slat);
        }
      });
      break;
    }

    case "full_length_mirror": {
      // Arched Cathedral Floor-Standing Dressing Mirror
      const frameThick = 0.03;
      const archR = width / 2;
      const straightH = Math.max(0.2, height - archR);

      // Outer Brass Frame Box
      const frameMat = brassMat;
      const leftPost = new THREE.Mesh(new THREE.BoxGeometry(frameThick, straightH, depth), frameMat);
      leftPost.position.set(-width / 2 + frameThick / 2, straightH / 2, 0);
      const rightPost = new THREE.Mesh(new THREE.BoxGeometry(frameThick, straightH, depth), frameMat);
      rightPost.position.set(width / 2 - frameThick / 2, straightH / 2, 0);
      const botPost = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, depth), frameMat);
      botPost.position.set(0, frameThick / 2, 0);
      group.add(leftPost);
      group.add(rightPost);
      group.add(botPost);

      // Top Arch
      const archGeo = new THREE.TorusGeometry(archR - frameThick / 2, frameThick / 2, 16, 32, Math.PI);
      const arch = new THREE.Mesh(archGeo, frameMat);
      arch.position.set(0, straightH, 0);
      group.add(arch);

      // Glass Mirror Plane with high specularity
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: "#E8EEF5",
        roughness: 0.05,
        metalness: 0.95,
      });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(width - frameThick * 2, straightH + archR * 0.8, 0.008), mirrorMat);
      glass.position.set(0, (straightH + archR * 0.8) / 2, 0);
      glass.castShadow = true;
      group.add(glass);
      break;
    }

    case "standing_desk": {
      // Motorized Sit-Stand Smart Desk
      const topH = 0.04;
      const topGeo = new THREE.BoxGeometry(width, topH, depth);
      const deskTop = new THREE.Mesh(topGeo, woodMat);
      deskTop.position.set(0, height - topH / 2, 0);
      deskTop.castShadow = true;
      group.add(deskTop);

      // Dual Inverted-T Motor Columns
      const legX1 = -width * 0.38;
      const legX2 = width * 0.38;
      [legX1, legX2].forEach((lx) => {
        // Vertical column
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.06, height - topH, 0.08), metalMat);
        col.position.set(lx, (height - topH) / 2, 0);
        col.castShadow = true;
        group.add(col);

        // Feet Base
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, depth * 0.85), metalMat);
        foot.position.set(lx, 0.015, 0);
        foot.castShadow = true;
        group.add(foot);
      });

      // Digital Control Keypad under front right
      const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.05), metalMat);
      keypad.position.set(width / 2 - 0.16, height - topH - 0.01, depth / 2 - 0.03);
      group.add(keypad);
      break;
    }

    case "floating_wall_shelf": {
      // Trio Staggered Floating Shelves
      const shelfThick = 0.03;
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, shelfThick, depth), woodMat);
      s1.position.set(0, height * 0.2, 0);
      s1.castShadow = true;
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, shelfThick, depth), woodMat);
      s2.position.set(-width * 0.12, height * 0.58, 0);
      s2.castShadow = true;
      const s3 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, shelfThick, depth), woodMat);
      s3.position.set(width * 0.1, height * 0.92, 0);
      s3.castShadow = true;
      group.add(s1);
      group.add(s2);
      group.add(s3);
      break;
    }

    case "acoustic_slat_panel": {
      // Architectural Oak Wood Slat Wall Panel
      const feltMat = new THREE.MeshStandardMaterial({
        color: "#181716",
        roughness: 0.95,
        metalness: 0.0,
      });
      const felt = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.01), feltMat);
      felt.position.set(0, height / 2, -depth / 2 + 0.005);
      group.add(felt);

      // Vertical Real-Wood Slats
      const slatCount = 14;
      const slatW = (width / slatCount) * 0.6;
      const slatD = depth * 0.85;
      for (let i = 0; i < slatCount; i++) {
        const sx = -width / 2 + (i + 0.5) * (width / slatCount);
        const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, height, slatD), woodMat);
        slat.position.set(sx, height / 2, 0);
        slat.castShadow = true;
        group.add(slat);
      }
      break;
    }

    default: {
      // Default geometric proxy
      const geo = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geo, fabricMat);
      mesh.position.set(0, height / 2, 0);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }

  // Set position & rotation from item state
  group.position.set(item.position[0], item.position[1], item.position[2]);
  group.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
  group.scale.set(item.scale[0], item.scale[1], item.scale[2]);

  return group;
}
