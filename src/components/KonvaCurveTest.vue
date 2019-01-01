<template>
  <div>
    <v-stage @mousedown="mouseDown" @mouseup="mouseUp" @mousemove="mouseMove" @dragend="updatePathFromCircle" ref="stage"
      :config="configKonva"
      >
      <PathLayer :paths="paths" />

      <v-layer ref="lineLayer">
        <v-line v-bind:points="pathPoints" :config="{
          x: 20,
          y: 200,
          tension: 0.5,
          closed: true,
          stroke: 'black',
          fillLinearGradientStartPoint: { x: -50, y: -50 },
          fillLinearGradientEndPoint: { x: 50, y: 50 },
          fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
        }"/>

      </v-layer>

      <CircleDragLayer :draggablePoints="draggablePoints" />

    </v-stage>
  </div>
</template>

<script>
import {toPath} from 'svg-points'
import {getCurvePoints} from 'cardinal-spline-js'
import CircleDragLayer from './CircleDragLayer.vue'
import PathLayer from './PathLayer.vue'

const width = window.innerWidth;
const height = window.innerHeight;
let vm = {};
export default {
  name: 'KonvaCurveTest',
  components: {
    CircleDragLayer,
    PathLayer
  },
  data() {
    return {
      configKonva: {
        width: width,
        height: height
      },
      list: [0, 0, 100, 0, 100, 100],
      draggablePoints: [],
      shape: [],
      objects: [],
      points: [],
      collectedDrawPoints: [],
      nextPointDir: [],
      //canvas: document.createElement('canvas'),
      isPaint: Boolean,
      paths: [],

      

    };
  },
  props: {
     
  },
  computed: {
    pathPoints: function () {
      return this.list
    },
    windowWidth: function () {
      return this.configKonva.width
    },
    windowHeigth: function () {
      return this.configKonva.height
    }
    // image: function () {
    //   return document.getElementById("drawImage")
    // },
    // context: function () {
    //   return this.canvas.getContext('2d')
    // }
  },
  beforeMount() {
    this.isPaint = false;
    this.paths = []

  },
  methods: {
    

    rotate( point, angle )
    {
        var newPoint = [];
        var cosAngle = Math.cos(angle); 
        var sinAngle = Math.sin(angle);
        newPoint[0] = cosAngle * point[0] - sinAngle * point[1];
        newPoint[1] = sinAngle * point[0] + cosAngle * point[1];
        return newPoint;
    },
    transformPoint( oldPoint, translate, angle )
    {
        var tmpPoint = [];
        
        tmpPoint[0] = oldPoint[0] - translate[0];
        tmpPoint[1] = oldPoint[1] - translate[1];
        
        var newPoint = this.rotate(tmpPoint, angle);
        
        return newPoint;
    },
    length(vec2) {
      return Math.sqrt( vec2[0] * vec2[0] + vec2[1] * vec2[1] )
    },
    normalize( vec2 )
    {
        var vec2Length = this.length(vec2);
        if ( vec2Length == 0 )
        {
            return 0;
        }
        var vec2Normal = [];
        vec2Normal[0] = vec2[0]/vec2Length;
        vec2Normal[1] = vec2[1]/vec2Length;
        return vec2Normal;
    },

    calculateRoatationAngleRelWorldX(dir)
    {
        var dirNormal = this.normalize(dir);
        // dot(A, [1,0]) = reduces to A[0]
        var dotProd = dirNormal[0];
        if ( dotProd < -1.0 )
        {
            dotProd = -1.0;
        }
        else if ( dotProd > 1.0 )
        {
            dotProd = 1.0;
        }
        var angle = Math.acos(dotProd);
        // cross([1,0,0] * [vec2Normal[0], vec2Normal[1], 0] reduces to -vec2Normal[1]
        var crossNormalSign = -dirNormal[1];
        if ( crossNormalSign < 0 )
        {
            angle = angle * -1.0;
        }
        return angle;
    },
    calculateCurvatureCutOff()
    {
        var curvatureCutOff = 30;
        return curvatureCutOff;
    },
    relVec2( v1,v2) {
      return [v2[0] - v1[0],v2[1] - v1[1]]
    },
    distance( v1, v2 ) {
      var vec2 = this.relVec2(v1,v2)
      return this.length(vec2)
    },
    verifyLastDrawPoint() {
      const numCollectedPoints = this.collectedDrawPoints.length
      if ( numCollectedPoints < 5 ) {
        return false
      }
      var width = this.windowWidth;  
      const pointsLength = this.points.length
      // // uAxis is local coordinate system x-axis
      // var uAxis = [0,0];
      // uAxis[0] = this.collectedDrawPoints[numCollectedPoints-1][0] - this.points[pointsLength-2];
      // uAxis[1] = this.collectedDrawPoints[numCollectedPoints-1][1] - this.points[pointsLength-1];
      var previousPoint = [this.points[pointsLength-2],this.points[pointsLength-1]];
      var potentialNewPoint = this.collectedDrawPoints[numCollectedPoints-1]

      var dir = this.relVec2(potentialNewPoint, previousPoint)

      if (this.length(dir) < this.calculateCurvatureCutOff()) {
        return false
      }
      if (this.length(this.nextPointDir))
      {
        // When we are outside the cut off distance, we assume a direction
        this.nextPointDir = this.normalize(dir)
        return false
      }

      //find angle between dir (local x axis) and worldFrame x-axis
      var angle = this.calculateRoatationAngleRelWorldX( dir );
      var maxHeight = 0;
      for ( var i = 1; i < numCollectedPoints; ++i )
      {
          var newPoint = this.transformPoint( this.collectedDrawPoints[i], previousPoint, angle );
          var height = Math.abs(newPoint[1]);
          
          if ( height > maxHeight )
          {
              maxHeight = height;
          }
          
          if ( height > this.calculateCurvatureCutOff() )
          {
              return true
          }
      }

      return false;
    },
    addPoint(e, x, y) {
      //this.shape.push( {x: x, y: y} )
      this.nextPointDir = []

      this.draggablePoints.push({
        x: x,
        y: y,
        circleData: {
        radius: 20,
        outerRadius: 50,
        fill: '#89b717',
        opacity: 0.8,
        draggable: true,
        scaleX: 1,
        scaleY: 1,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowOpacity: 0.6,
        startScale: 1
        }
      });

      this.points.push(this.draggablePoints[this.draggablePoints.length-1].x)
      this.points.push(this.draggablePoints[this.draggablePoints.length-1].y)

    },
    updatePoint(circleId, x, y) {
      this.points[circleId*2] = x
      this.points[circleId*2 + 1] = y
      this.draggablePoints[circleId].x = x
      this.draggablePoints[circleId].y = y
    },
    updateCurve() {
      var tmpPoints = getCurvePoints(this.points,0.5, 25, true)
      var arrayLength = tmpPoints.length*0.5
      var tmpShape = []
      for (var i = 0; i < arrayLength; ++i) {
        tmpShape.push( {x: tmpPoints[i*2], y: tmpPoints[i*2 +1] })
      }
      
      this.paths[this.paths.length - 1] = toPath(tmpShape)
      // update in ugly reactive way
      this.paths.push("")
      this.paths.pop()
    },
    updatePathFromCircle(e) {
      if (e.target.VueComponent == null || e.target.attrs.x == null) {
        return 
      }
      this.updatePoint(e.target.VueComponent.$parent.circleId,e.target.attrs.x, e.target.attrs.y)
      //Updating the last path
      this.updateCurve()
    },
    mouseMove(e) {
      this.updatePathFromCircle(e)
      
      if (this.isPaint == false) {
        return
      }
      var x = e.evt.offsetX
      var y = e.evt.offsetY
      this.collectedDrawPoints.push([x,y])

      if (this.verifyLastDrawPoint()) {
        this.addPoint(e, x, y)
        
        this.collectedDrawPoints = []
      }
      
      this.updateCurve()
      //console.log(this.paths)
    },
    mouseDown(e) {

      if (e.target.nodeType != "Stage") {
        return
      }


      if (this.points.length > 3) {
        // save the last points list
        this.objects.push(this.points)
      }
      else {
        this.paths.pop()
      }
      // push the next path to be drawn
      this.paths.push("")


      this.isPaint = true;
      var x = e.evt.offsetX
      var y = e.evt.offsetY
      this.shape = []
      // Clear current shape
      this.points = []
      this.draggablePoints = []
      

      this.addPoint(e, x, y)
      

    },
    mouseUp(e) {
      this.isPaint = false;
      this.collectedDrawPoints = []

    },
    handleDragstart(e) {
      const shape = e.target;
      const dragLayer = vm.$refs.dragLayer.getNode();
      const stage = vm.$refs.stage.getNode();
      // moving to another layer will improve dragging performance
      shape.moveTo(dragLayer);
      stage.draw();
      shape.setAttrs({
        shadowOffsetX: 15,
        shadowOffsetY: 15,
        scaleX: shape.getAttr('startScale') * 1.2,
        scaley: shape.getAttr('startScale') * 1.2
      });
    },
    handleDragend(e) {
      const shape = e.target;
      const layer = vm.$refs.layer.getNode();
      const stage = vm.$refs.stage.getNode();
      shape.moveTo(layer);
      stage.draw();
      shape.to({
        duration: 0.5,
        easing: Konva.Easings.ElasticEaseOut,
        scaleX: shape.getAttr('startScale'),
        scaleY: shape.getAttr('startScale'),
        shadowOffsetX: 5,
        shadowOffsetY: 5
      });
    },
    drawCurves() {
      // var context = curveLayer.getContext();

      // context.clear();

      // // draw quad
      // context.beginPath();
      // context.moveTo(quad.start.attrs.x, quad.start.attrs.y);
      // context.quadraticCurveTo(quad.control.attrs.x, quad.control.attrs.y, quad.end.attrs.x, quad.end.attrs.y);
      // context.setAttr('strokeStyle', 'red');
      // context.setAttr('lineWidth', 4);
      // context.stroke();

      // // draw bezier
      // context.beginPath();
      // context.moveTo(bezier.start.attrs.x, bezier.start.attrs.y);
      // context.bezierCurveTo(bezier.control1.attrs.x, bezier.control1.attrs.y, bezier.control2.attrs.x, bezier.control2.attrs.y, bezier.end.attrs.x, bezier.end.attrs.y);
      // context.setAttr('strokeStyle', 'blue');
      // context.setAttr('lineWidth', 4);
      // context.stroke();
    }

  },
  mounted() {
    vm = this;
  }
}
</script>