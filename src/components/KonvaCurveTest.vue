<template>
  <div>
    <Anne/>
    <v-stage @touchstart="mouseDown" @touchmove="mouseMove" @mousedown="mouseDown" @touchend="mouseUp" @mouseup="mouseUp" @mousemove="mouseMove"  ref="stage"
      :config="configKonva"
      >
      
      <v-layer ref="drawLayer">
        <ClosedPath :path="currentPath" :pathId="selectedPathId" :config="pathConfig"/>
      </v-layer>
      <PathLayer :objects="objects" :pathConfig="pathConfig"/>

      <v-layer ref="lineLayer">
        <v-line v-bind:points="pathPoints" :config="{
          x: 20,
          y: 200,
          tension: 0.5,
          closed: true,
          stroke: 'red',
          fillLinearGradientStartPoint: { x: -50, y: -50 },
          fillLinearGradientEndPoint: { x: 50, y: 50 },
          fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
        }"/>

      </v-layer>
      <CircleDragLayer :draggablePoints="draggablePoints"  :key="updateVar"/>


    </v-stage>
  </div>
</template>

<script>
import Anne from './ApolloExample.vue'
import {toPath} from 'svg-points'
import {getCurvePoints} from 'cardinal-spline-js'
import CircleDragLayer from './CircleDragLayer.vue'
import PathLayer from './PathLayer.vue'
import ClosedPath from './ClosedPath.vue'

const width = window.innerWidth;
const height = window.innerHeight;
let vm = {};
export default {
  name: 'KonvaCurveTest',
  components: {
    CircleDragLayer,
    PathLayer,
    ClosedPath,
    Anne
  },
  data() {
    return {
      configKonva: {
        width: width,
        height: height
      },
      list: [0, 0, 100, 0, 100, 100],
      objects: [],
      draggablePoints: [],
      points: [],
      collectedDrawPoints: [],
      nextPointDir: [],
      //canvas: document.createElement('canvas'),
      isPaint: Boolean,
      isMouseDown: false,
      currentPath: "",
      selectedPathId: -1,
      componentMoveOffsetX: 0,
      componentMoveOffsetY: 0,
      updateVar: 0,
      pathChanged: 0,
      pathConfig: { tension: 0.5, closed: false, stroke: 'black',
          fill: 'red',
          fillLinearGradientStartPoint: { x: -50, y: -50 },
          fillLinearGradientEndPoint: { x: 50, y: 50 },
          fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
        }

      

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
    },
    pathDirty: function () {
      return this.pathChanged
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
      const pointsLength = this.points.length
      if ( numCollectedPoints < 5) {
        if (numCollectedPoints == 4 && pointsLength == 0 ) {
          // If we have no added point, we use the 4th point collected
          // (we may move 3 pixles and still can select whatever we do mouseup at)
          return true
        }
        return false
      }
      var width = this.windowWidth;  
      
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
      console.log("Adding point")
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

      this.points.push(x)
      this.points.push(y)

    },
    updatePoint(circleId, x, y) {
      console.log("Update point")
      console.log(this.points[circleId*2])
      console.log(x)
      this.points[circleId*2] = x
      this.points[circleId*2 + 1] = y
      this.draggablePoints[circleId].x = x
      this.draggablePoints[circleId].y = y
      this.pathChanged = this.pathChanged + 1
    },
    updateCurve() {
      var tmpPoints = getCurvePoints(this.points,0.5, 25, true)
      var arrayLength = tmpPoints.length*0.5
      var tmpShape = []
      for (var i = 0; i < arrayLength; ++i) {
        tmpShape.push( {x: tmpPoints[i*2], y: tmpPoints[i*2 +1] })
      }
      console.log("updating the current path")
      this.currentPath = toPath(tmpShape)


    },
    updatePathFromCircle(e) {
      console.log("drag end with seleced path id:")
      console.log(this.selectedPathId)


    },
    mouseMove(e) {
      
      
      if (this.isPaint == false && this.selectedPathId == -1) {
        return
      }

      var x = e.evt.offsetX
      var y = e.evt.offsetY
      if (x == null) {
        console.log(e)
        x = e.currentTarget.pointerPos.x
        y = e.currentTarget.pointerPos.y
      }
      if (this.selectedPathId == -1) {
        console.log(e)



        this.collectedDrawPoints.push([x,y])

        if (this.verifyLastDrawPoint()) {
          this.addPoint(e, x, y)
          
          this.collectedDrawPoints = []
        }
        
        this.updateCurve()
      }
      else if (e.target.className != "Circle" && this.isMouseDown){
        var dx = x - this.componentMoveOffsetX
        var dy = y - this.componentMoveOffsetY
        console.log(this.draggablePoints)
        for (var i = 0; i < this.draggablePoints.length; i++) {
          this.updatePoint(i, this.draggablePoints[i].x + dx, this.draggablePoints[i].y + dy)
        }
        this.updateCurve()
        this.componentMoveOffsetX = x
        this.componentMoveOffsetY = y
        this.pathChanged = this.pathChanged + 1
      }

      e.evt.preventDefault()
      //console.log(this.paths)
    },
    mouseDown(e) {
      console.log("Mouse Down")
      this.isMouseDown = true

      if (e.target.className == "Circle") {
        //exit if hit circle
        return
      }

      if (e.target.VueComponent != null && e.target.VueComponent.$parent.pathId == this.selectedPathId ) {
        //exit if we hit the already selected path
        this.componentMoveOffsetX  = e.evt.offsetX
        this.componentMoveOffsetY = e.evt.offsetY
        if (this.componentMoveOffsetX == null) {
          console.log("using touch data")
          console.log(e.evt)
          this.componentMoveOffsetX = e.currentTarget.pointerPos.x
          this.componentMoveOffsetY = e.currentTarget.pointerPos.y
        }
        return    
      }

      console.log("Start drawing")
      // push the next path to be drawn
      this.clearCurrentTempPath()
      this.selectedPathId = -1

      this.isPaint = true;
      // var x = e.evt.offsetX
      // var y = e.evt.offsetY
      // //we catch touch event pos
      // if (e.evt.offsetX == null) {
      //   console.log(e.evt.changedTouches[0])
      //   x = e.evt.changedTouches[0].screenX
      //   y = e.evt.changedTouches[0].screenY
      // }

      //this.addPoint(e, x, y)
      this.pathChanged = 0

    },
    clearCurrentTempPath() {
      this.currentPath = ""
      this.draggablePoints = []
      this.points = []
    },
    mouseUp(e) {
      console.log("Mouse up")
      this.isMouseDown = false
      this.collectedDrawPoints = []

      if ( this.drawingPointsCollected() ) {
        // save the last points list
        this.objects.push( { draggablePoints: this.draggablePoints, points: this.points, path: this.currentPath})
        console.log("Clearing current path")
        this.clearCurrentTempPath()
      }
      else {
        if (e.target.className != "Circle" && this.selectedPathId < 0) {
          console.log("Trying to select path")
          this.selectPath(e)
        }
        var x = e.evt.offsetX
        var y = e.evt.offsetY
        if (x == null) {
          console.log(e)
          x = e.currentTarget.pointerPos.x
          y = e.currentTarget.pointerPos.y
        }
        if (e.target.VueComponent != null && x != null && e.target.VueComponent.$parent.circleId != null ) {
          console.log(e)
          console.log("Update point and path after circle move")
          this.updatePoint(e.target.VueComponent.$parent.circleId,x, y)
          //Updating the last path
          this.updateCurve()
        }

        if (this.selectedPathId >= 0) {
          this.objects[this.selectedPathId].points = this.points
          this.objects[this.selectedPathId].path = this.currentPath
          this.objects[this.selectedPathId].draggablePoints = this.draggablePoints
          console.log("Here we should update the drawn path")
          this.updateVar = this.updateVar + 1
          this.pathChanged = this.pathChanged + 1
        }
      }

      this.isPaint = false;

      console.log("Not painting any more")
      console.log(this.objects)
    },
    drawingPointsCollected() {
      return (this.isPaint == true && this.points.length > 3)
    },
    selectPath(e) {

      if (e.target.VueComponent == null) {
        return 
      }

      if (this.drawingPointsCollected()) {
        return
      }
      console.log("Select path")
      console.log(e.target.VueComponent.$parent.pathId)
      this.selectedPathId = e.target.VueComponent.$parent.pathId

      this.draggablePoints = this.objects[this.selectedPathId].draggablePoints
      console.log(this.objects[this.selectedPathId].draggablePoints) 
      console.log(this.draggablePoints) 
      this.points = this.objects[this.selectedPathId].points
      this.currentPath = this.objects[this.selectedPathId].path

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