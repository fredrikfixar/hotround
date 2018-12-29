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
      <v-layer ref="drawLayer">
        <v-path name="path" v-bind:points="drawPoints" :x="drawStartX" :y="drawStartY" :config="{
          tension: 0.5,
          closed: false,
          stroke: 'black',
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
      drawList: [], 
      //canvas: document.createElement('canvas'),
      isPaint: Boolean,
      drawStartX: Number,
      drawStartY: Number,
      

    };
  },
  props: {
     
  },
  computed: {
    pathPoints: function () {
      return this.list
    },
    drawPoints: function () {
      return this.drawList
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

  },
  methods: {
    mouseMove(e) {
      if (this.isPaint == false) {
        return
      }
      var x = e.evt.pageX
      var y = e.evt.pageY
      this.drawList.push(x-this.drawStartX)
      this.drawList.push(y-this.drawStartY)
    },
    mouseDown(e) {
      var x = e.evt.pageX
      var y = e.evt.pageY
      
      if (this.isPaint == false) {
        this.drawList = []
        this.drawStartX = x
        this.drawStartY = y
      }
      this.drawList.push(0)
      this.drawList.push(0)
      this.isPaint = true;

    },
    mouseUp(e) {
      this.isPaint = false;
      console.log(this.drawPoints)
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