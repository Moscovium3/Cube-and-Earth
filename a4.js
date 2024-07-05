import { Mat4 } from './math.js';
import { Parser } from './parser.js';
import { Scene } from './scene.js';
import { Renderer } from './renderer.js';
import { TriangleMesh } from './trianglemesh.js';

// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement createCube, createSphere, computeTransformation, and shaders
////////////////////////////////////////////////////////////////////////////////

// Function: Convert degrees to radians
function degreesToRadians(angle) {
  return angle * Math.PI / 180;
}

TriangleMesh.prototype.createCube = function() {
  // Create a cube with different vertex order and representation
  this.positions = [
    // Front
    -1, 1, 1, 1, -1, 1, -1, -1, 1,
    -1, 1, 1, 1, -1, 1, 1, 1, 1,

    // Right
    1, 1, -1, 1, -1, 1, 1, -1, -1,
    1, 1, -1, 1, -1, 1, 1, 1, 1,

    // Top
    1, 1, -1, -1, 1, 1, -1, 1, -1,
    1, 1, -1, -1, 1, 1, 1, 1, 1,

    // Bottom
    1, -1, -1, -1, -1, 1, -1, -1, -1,
    1, -1, -1, -1, -1, 1, 1, -1, 1,

    // Left
    -1, 1, -1, -1, -1, 1, -1, -1, -1,
    -1, 1, -1, -1, -1, 1, -1, 1, 1,

    // Back
    -1, 1, -1, 1, -1, -1, -1, -1, -1,
    -1, 1, -1, 1, -1, -1, 1, 1, -1
  ];

  // Normals are the same as positions for a unit cube
  this.normals = this.positions;

  this.uvCoords = [
    // Front
    0.5, 2/3, 0, 1, 0.5, 1,
    0.5, 2/3, 0, 1, 0, 2/3,

    // Right
    0.5, 2/3, 0, 1/3, 0.5, 1/3,
    0.5, 2/3, 0, 1/3, 0, 2/3,

    // Top
    0.5, 1/3, 0, 0, 0.5, 0,
    0.5, 1/3, 0, 0, 0, 1/3,

    // Bottom
    1, 1, 0.5, 2/3, 1, 2/3,
    1, 1, 0.5, 2/3, 0.5, 1,

    // Left
    0.5, 1/3, 1, 2/3, 1, 1/3,
    0.5, 1/3, 1, 2/3, 1, 1/3,

    // Back
    0.5, 0, 1, 1/3, 0.5, 1/3,
    0.5, 0, 1, 1/3, 1, 0
  ];
};

TriangleMesh.prototype.createSphere = function(stackCount, sectorCount) {
  // Increase stackCount and sectorCount for higher detail
  stackCount = stackCount * 2; // You can adjust this multiplier to increase or decrease detail
  sectorCount = sectorCount * 2; // Same here

  this.positions = [];
  this.uvCoords = [];
  this.indices = [];
  this.normals = [];

  for (let stack = 0; stack <= stackCount; ++stack) {
    let phi = Math.PI / 2 - stack * Math.PI / stackCount;
    for (let sector = 0; sector <= sectorCount; ++sector) {
      let theta = 2 * Math.PI * sector / sectorCount;

      let x = Math.cos(phi) * Math.cos(theta);
      let y = Math.cos(phi) * Math.sin(theta);
      let z = Math.sin(phi);
      this.positions.push(x, y, z);

      this.normals.push(x, y, z); // For a unit sphere, normals are the same as positions

      let u = 1 - sector / sectorCount;
      let v = stack / stackCount;
      this.uvCoords.push(u, v);
    }
  }

  for (let stack = 0; stack < stackCount; ++stack) {
    let k1 = stack * (sectorCount + 1);
    let k2 = k1 + sectorCount + 1;

    for (let sector = 0; sector < sectorCount; ++sector, ++k1, ++k2) {
      if (stack != 0) {
        this.indices.push(k1, k2, k1 + 1);
      }
      if (stack != (stackCount - 1)) {
        this.indices.push(k1 + 1, k2, k2 + 1);
      }
    }
  }
};

Scene.prototype.computeTransformation = function(transformSequence) {
  // Go through the transform sequence and compose into an overallTransform
  let overallTransform = Mat4.create();

  for (let i = transformSequence.length - 1; i >= 0; i--) {
    let firstItem = transformSequence[i][0];
    let transformS = [];

    switch (firstItem) {
      case 'Rx': {
        const radian = degreesToRadians(transformSequence[i][1]);
        transformS = [
          1, 0, 0, 0,
          0, Math.cos(radian), -Math.sin(radian), 0,
          0, Math.sin(radian), Math.cos(radian), 0,
          0, 0, 0, 1
        ];
        break;
      }
      case 'Ry': {
        const radian = degreesToRadians(transformSequence[i][1]);
        transformS = [
          Math.cos(radian), 0, Math.sin(radian), 0,
          0, 1, 0, 0,
          -Math.sin(radian), 0, Math.cos(radian), 0,
          0, 0, 0, 1
        ];
        break;
      }
      case 'Rz': {
        const radian = degreesToRadians(transformSequence[i][1]);
        transformS = [
          Math.cos(radian), -Math.sin(radian), 0, 0,
          Math.sin(radian), Math.cos(radian), 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ];
        break;
      }
      case 'S': {
        transformS = [
          transformSequence[i][1], 0, 0, 0,
          0, transformSequence[i][2], 0, 0,
          0, 0, transformSequence[i][3], 0,
          0, 0, 0, 1
        ];
        break;
      }
      case 'T': {
        transformS = [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          transformSequence[i][1], transformSequence[i][2], transformSequence[i][3], 1
        ];
        break;
      }
      default:
        console.error(`Unknown transformation type: ${type}`);
        return;
    }
    Mat4.multiply(overallTransform, overallTransform, transformS);
  }
  return overallTransform;
}

// Vertex Shader
Renderer.prototype.VERTEX_SHADER = `
precision mediump float;
attribute vec3 position, normal;
attribute vec2 uvCoord;
uniform vec3 lightPosition;
uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
uniform mat3 normalMatrix;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vLightDirection;
varying vec3 vFragPosition;
varying float vDistance;

void main() {
  vTexCoord = uvCoord;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * worldPosition;
  vFragPosition = viewPosition.xyz;
  vLightDirection = normalize(lightPosition - worldPosition.xyz);
  vDistance = length(viewPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}
`;

// Fragment Shader
Renderer.prototype.FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vLightDirection;
varying vec3 vFragPosition;
varying float vDistance;

void main() {
  vec3 ambient = ka * lightIntensity;
  vec3 normalizedNormal = normalize(vNormal);
  vec3 normalizedLightDir = normalize(vLightDirection);
  float lambertian = max(dot(normalizedNormal, normalizedLightDir), 0.0);
  vec3 diffuse = kd * lambertian * lightIntensity;
  vec3 viewDirection = normalize(-vFragPosition);
  vec3 halfVector = normalize(normalizedLightDir + viewDirection);
  float specAngle = max(dot(normalizedNormal, halfVector), 0.0);
  vec3 specular = ks * pow(specAngle, shininess) * lightIntensity;
  vec3 finalColor = ambient + diffuse + specular;
  if (hasTexture) {
    finalColor *= texture2D(uTexture, vTexCoord).rgb;
  }
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////

const DEF_INPUT = [
  "c,myCamera,perspective,0,5,10,0,0,0,0,1,0;", // Place camera to overlook the scene
  "l,myLight,point,2,5,2,1,1,1;", // Place a light source at a different position
  "p,groundPlane,cube;", // Create a ground plane
  "m,groundMat,0.2,0.7,0.2,0.8,0.8,0.8,0.0,0.0,0.0,10;", // Customize ground material
  "o,ground,groundPlane,groundMat;", // Apply ground material to the ground
  "p,building1,cube;", // Create building 1
  "m,buildingMat1,0.7,0.1,0.1,0.8,0.8,0.8,0.5,0.5,0.5,10;", // Customize material for building 1
  "o,buildingOne,building1,buildingMat1;", // Apply material for building 1
  "X,buildingOne,T,2,0,2;", // Translate building 1 to a specified position
  "p,building2,cube;", // Create building 2
  "m,buildingMat2,0.1,0.1,0.7,0.8,0.8,0.8,0.5,0.5,0.5,10;", // Customize material for building 2
  "o,buildingTwo,building2,buildingMat2;", // Apply material for building 2
  "X,buildingTwo,T,-2,0,-2;", // Translate building 2 to a specified position
  "p,sphere1,sphere,20,20;", // Create a sphere
  "m,sphereMat,0.8,0.8,0.8,0.8,0.8,0.8,0.9,0.9,0.9,10;", // Customize material for the sphere
  "o,sphereOne,sphere1,sphereMat;", // Applying sphere material to the sphere
  "X,sphereOne,T,0,1,0;", // Translate the sphere to the air
  "X,sphereOne,S,1.5,1.5,1.5;", // Scale the sphere
  "X,sphereOne,Rx,0.01;", // Rotate the sphere around the X-axis
  "X,sphereOne,Ry,0.02;", // Rotate the sphere around the Y-axis
  "X,sphereOne,Rz,0.03;", // Rotate the sphere around the Z-axis
  "m,textureMat,0.2,0.2,0.2,0.8,0.8,0.8,0.5,0.5,0.5,10,dice.jpg;", // Custom material with texture
  "o,textureSphere,sphere1,textureMat;" // Applying the material with texture to the sphere

].join("\n");


// DO NOT CHANGE ANYTHING BELOW HERE
export { Parser, Scene, Renderer, DEF_INPUT };
