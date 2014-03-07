timepicker
==========

##JQuery UI timepicker control

####[See demo here](http://jsfiddle.net/LuLct/1/)
###Usage:
```javascript
$(function()
{
	var p = $('#timepicker1').timepicker();
  p.timepicker('option','value', '22:10');
  $('#timepicker1').timepicker('option','maxTime', '20:15');
  $('#timepicker1').timepicker('option','minTime', '23:10');
});
```
#:raised_hand:Task list
- [ ] pop-up behaviour
- [ ] 12hrs format
- [ ] steps on spin
- [ ] seconds picker
- [ ] time format pattern
