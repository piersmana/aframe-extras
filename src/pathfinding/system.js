var Path = require('three-pathfinding');

var ZONE = 'level';

/**
 * nav
 *
 * Pathfinding system, using PatrolJS.
 */
module.exports = {
  init: function () {
    this.navMesh = null;
    this.nodes = null;
    this.controllers = new Set();
  },

  /**
   * @param {THREE.Mesh} mesh
   */
  setNavMesh: function (mesh) {
    var geometry = mesh.geometry.isBufferGeometry
      ? new THREE.Geometry().fromBufferGeometry(mesh.geometry)
      : mesh.geometry;
    this.navMesh = new THREE.Mesh(geometry);
    this.nodes = Path.buildNodes(this.navMesh.geometry);
    Path.setZoneData(ZONE, this.nodes);
  },

  /**
   * @return {THREE.Mesh}
   */
  getNavMesh: function () {
    return this.navMesh;
  },

  /**
   * @param {NavController} ctrl
   */
  addController: function (ctrl) {
    this.controllers.add(ctrl);
  },

  /**
   * @param {NavController} ctrl
   */
  removeController: function (ctrl) {
    this.controllers.remove(ctrl);
  },

  /**
   * @param  {NavController} ctrl
   * @param  {THREE.Vector3} target
   * @return {Array<THREE.Vector3>}
   */
  getPath: function (ctrl, target) {
    var start = ctrl.el.object3D.position;
    // TODO(donmccurdy): Current group should be cached.
    var group = Path.getGroup(ZONE, start);
    return Path.findPath(start, target, ZONE, group);
  },

  clampToNavMesh: (function () {
    var point = new THREE.Vector3();
    var plane = new THREE.Plane();
    return function (start, end) {
      if (!this.navMesh) return end;
      var group = Path.getGroup(ZONE, start);
      var startNode = Path.getClosestNode(start, ZONE, group, true);
      var endNode = Path.getClosestNode(end, ZONE, group, true);

      var clampedEnd;
      if (!startNode) {
        return end;
      } else if (!endNode) {
        clampedEnd = Path.projectPathOnNode(start, end, startNode, ZONE, point);
        endNode = startNode;
      } else {
        clampedEnd = point.copy(end);
      }

      if (!clampedEnd || clampedEnd === start) {
        return start;
      }

      var endNodeVertices = Path.getNodeVertices(endNode, ZONE);
      plane.setFromCoplanarPoints(endNodeVertices[0], endNodeVertices[1], endNodeVertices[2]);
      return plane.projectPoint(clampedEnd);
    };
  }())
};
