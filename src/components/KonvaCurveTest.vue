<template>
  <div>
    <v-stage @mousedown="mouseDown" @mouseup="mouseUp" @mousemove="mouseMove" ref="stage"
      :config="configKonva"
      @dragstart="handleDragstart"
      @dragend="handleDragend">
      <v-layer ref="curveLayer"></v-layer>
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
      <v-layer ref="anchorLayer"></v-layer>
      <v-layer ref="layer">
        <v-circle
          v-for="item in draggablePoints"
          :key="item.id"
          :config="item"></v-circle>
      </v-layer>
      <v-layer ref="drawLayer">
        <v-path v-bind:data="drawPath" :config="{
          tension: 0.5,
          closed: false,
          stroke: 'black',
          fill: 'pink',
          fillLinearGradientStartPoint: { x: -50, y: -50 },
          fillLinearGradientEndPoint: { x: 50, y: 50 },
          fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
        }"/>
        <!-- <v-image
          name = "drawImage"
          :x="windowWidth"
          :y="windowHeigth"
          :image="canvas"
          :config="{
          stroke: 'green',
          shadowBlur: 5
          }">

        </v-image> -->
      </v-layer>
      

    </v-stage>
  </div>
</template>

<script>
import {toPath} from 'svg-points'
import {getCurvePoints} from 'cardinal-spline-js'

const width = window.innerWidth;
const height = window.innerHeight;
let vm = {};
export default {
  name: 'CanvasWithCurve',
  data() {
    return {
      configKonva: {
        width: width,
        height: height
      },
      list: [0, 0, 100, 0, 100, 100],
      draggablePoints: [],
      shape: [],
      points: [],
      collectedDrawPoints: [],
      //canvas: document.createElement('canvas'),
      isPaint: Boolean,
      path: String,
      prevX: 0,
      prevY: 0,
      prevX2: 0,
      prevY2: 0,
      count: 0

      

    };
  },
  props: {
     
  },
  computed: {
    pathPoints: function () {
      return this.list
    },
    drawPath: function () {
      return this.path
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
    this.path = ""

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

    calculateRoatationAngleRelWorldX(vec2)
    {
        var vec2Normal = this.normalize(vec2);
        // dot(A, [1,0]) = reduces to A[0]
        var dotProd = vec2Normal[0];
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
        var crossNormalSign = -vec2Normal[1];
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
    distance( v1, v2 ) {
      var vec2 = [v2[0] - v1[0],v2[1] - v1[1]]
      return this.length(vec2)
    },
    verifyLastDrawPoint() {
      const numCollectedPoints = this.collectedDrawPoints.length
      if ( numCollectedPoints < 5 ) {
        return false
      }
      var width = this.windowWidth;  
      const pointsLength = this.points.length
      // uAxis is local coordinate system x-axis
      var uAxis = [0,0];
      uAxis[0] = this.collectedDrawPoints[numCollectedPoints-1][0] - this.points[pointsLength-2];
      uAxis[1] = this.collectedDrawPoints[numCollectedPoints-1][1] - this.points[pointsLength-1];
      var previousPoint = [this.points[pointsLength-2],this.points[pointsLength-1]];
      var potentialNewPoint = this.collectedDrawPoints[numCollectedPoints-1]

      if (this.distance( previousPoint, potentialNewPoint ) < this.calculateCurvatureCutOff()) {
        return false
      }

      //find angle between uAxis and worldFrame x-axis
      var angle = this.calculateRoatationAngleRelWorldX( uAxis);
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
            console.log("previousPoint")
            console.log(previousPoint)
            console.log("this.collectedDrawPoints[i]")
            console.log(this.collectedDrawPoints[i])
              return true
          }
      }

      return false;
    },
    addPoint(e, x, y) {
      this.points.push(x)
      this.points.push(y)
      this.shape.push( {x: x, y: y} )
      this.prevX2 = this.prevX
      this.prevY2 = this.prevY
      this.prevX = x
      this.prevY = y

      this.draggablePoints.push({
        x: x,
        y: y,
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
      });

    },
    mouseMove(e) {
      if (this.isPaint == false) {
        return
      }
      var x = e.evt.offsetX
      var y = e.evt.offsetY
      this.collectedDrawPoints.push([x,y])

      if (this.verifyLastDrawPoint()) {
        this.addPoint(e, x, y)
        this.count = 0
        this.collectedDrawPoints = []
      }      
      
      var tmpPoints = getCurvePoints(this.points,0.5, 25, true)
      var arrayLength = tmpPoints.length*0.5
      var tmpShape = []
      for (var i = 0; i < arrayLength; ++i) {
        tmpShape.push( {x: tmpPoints[i*2], y: tmpPoints[i*2 +1] })
      }

      this.path = toPath(tmpShape)

    },
    mouseDown(e) {
      this.isPaint = true;
      var x = e.evt.offsetX
      var y = e.evt.offsetY
      this.shape = []
      // Clear current shape
      this.points = []
      this.draggablePoints = []
      this.prevX = x
      this.prevY = y
      this.addPoint(e, x, y)


    },
    mouseUp(e) {
      this.isPaint = false;
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