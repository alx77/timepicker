/**
 * jQueryUI-based timepicker plug-in
 * MIT License. Copyright (c) 2014 I-Ween
 * http://i-ween.com, http://stayinweb.com
 */
/*TODO
 * 1) implement pop-up behaviour
 * 2) implement 12hrs format
 * 3) implement steps on spin
 * 4) implement seconds picker
 * 5) implement time format pattern
 */

(function($) 
{
	$.widget("siw.timepicker", 
	{
		options:
		{
			value:'',
			spinTimeout:150,
			linkedMinutesHours:true, //increase hours after 59 minutes achieved
			minTime:false, //can work only with maxTime
			maxTime:false, //can work only with minTime
			inverseButton:false,
			onGenerate:function() {},
			onClose:function() {},
			onChangeTime:function(evt, data) {/*console.log(data.newTime)*/},
			onRenderStart:function() {},
			onShow:function() {},
/*			formatTime:'H:i',
			stepMinutes:5,
			opened:false,
			inline:false,
			hours12:false,
			allowBlank:false,
			roundTime:'round' // ceil, floor
			readonly: false,
			*/
		},
		_create: function() 
		{
			this.element.hide();
			var self = this;
			this._render();

			this.element.change(function (e)
			{
				self.val(self.element.val());
			});
			$(window).unload(function (e) 
			{
				self.destroy();
			});
			this._trigger("onGenerate");
		},
		destroy: function () 
		{
			this.control.remove();
			this.element.show();
			$.Widget.prototype.destroy.call(this);
			this._trigger("onClose");
		},
		_setOption: function(key, value)
		{
			if (value != undefined)
		    {
				this.options[key] = value;
				this._render();
				return this;
		    }
		    else
		    {
		    	return this.options[key];
		    }
		 },
		_render: function()
		{
			this._trigger("onRenderStart");
			if (this.control != undefined) this.control.remove();
			var self = this;
			this.control = $('<div class="siw_datetimepicker siw_noselect  siw_inline"><div class="siw_timepicker active"><div class="siw_buttons">'
			+'<div class="siw_prev prev_hour"></div><div class="siw_prev prev_minute"></div></div><div class="siw_time_box siw_scroller_box"><div class="siw_time_variant" style="margin-top: 0px;">'
			+'<input class="siw_time_edit hours" type="text"/><div class="siw_separator">:</div><input class="siw_time_edit minutes" type="text"/></div></div><div class="siw_buttons">'
			+'<div class="siw_next next_hour"></div><div class="siw_next next_minute"></div></div></div></div>')
			.insertAfter(this.element).hide();

			if (this.options.value && this.options.value != undefined)
			{
				this.val(this.options.value);
				this._recalculate();
			}
			else if (this.element.val() != undefined)
			{
				this.val(this.element.val());
			}

			if (this.options.maxTime && this.options.maxTime != undefined && this.options.minTime && this.options.minTime != undefined)
			{
				var valArr = this.options.maxTime.split(':');
				this.maxHrs = isNaN(parseInt(valArr[0]))?23:parseInt(valArr[0]),
				this.maxMins = isNaN(parseInt(valArr[1]))?23:parseInt(valArr[1]);
				valArr = this.options.minTime.split(':');
				this.minHrs = isNaN(parseInt(valArr[0]))?59:parseInt(valArr[0]),
				this.minMins = isNaN(parseInt(valArr[1]))?59:parseInt(valArr[1]);
				this.reverseRange = this.maxHrs < this.minHrs || (this.maxHrs == this.minHrs && this.maxMins < this.minMins);
			}

			this.control.find('.hours').change(function (e)
			{
				var $this = $(this),
					value = self._validateHrs($this.val());
				$this.val(value);
				self._spinMinImpl(); //for revalidation only
				self._recalculate();
				self._trigger("onChangeTime", null, {newTime:self.val()});
			});
			this.control.find('.minutes').change(function (e)
			{
				var $this = $(this),
					value = self._validateMins($this.val());
				$this.val(value);
				self._recalculate();
				self._trigger("onChangeTime", null, {newTime:self.val()});
			});
			this.control.find('.hours, .minutes').focus(function (e)
			{
			    this.select();
			});

			this.control.find('.prev_hour, .next_hour').click(function (e)
			{
				var $this = $(this);
				self._spinHrs($this);
			});
			this.control.find('.prev_minute, .next_minute').click(function (e)
			{
				var $this = $(this);
				self._spinMin($this);
			});
			this.control.find('.prev_hour, .next_hour').mousedown(function (e)
			{
				var $this = $(this);
				self.timeout = setInterval(function()
				{
					self._spinHrs($this);
			    }, self.options.spinTimeout);
			});
			this.control.find('.prev_minute, .next_minute').mousedown(function (e)
			{
				var $this = $(this);
				self.timeout = setInterval(function()
				{
					self._spinMin($this);
			    }, self.options.spinTimeout);
			});
			$(document).mouseup(function()
			{
				clearInterval(self.timeout);
				return false;
			});
			this.control.show();
			this._trigger("onShow");
		},
		_spinHrs: function($this, increment)
		{
			this._spinHrsImpl($this, increment);
			this._trigger("onChangeTime", null, {newTime:this.val()});
		},
		_spinHrsImpl: function($this, increment)
		{
			var hrsCtrl = this.control.find(".hours"),
			value = parseInt(hrsCtrl.val());
			if ($this != undefined)
			{
				value = value + (($this.hasClass('siw_prev') ^ this.options.inverseButton)?1:-1);
			}
			if (increment != undefined)
			{
				value = value + increment;
			}
			if (value > 23)
			{
				this._trigger("hoursAboveMax");
				value = 0;
			}
			if (value < 0)
			{
				this._trigger("hoursBelowMin");
				value = 23;
			}
			value = this._validateHrs(value);
			hrsCtrl.val(value);
			this._spinMinImpl(); //for revalidation only
			this._recalculate();
		},
		_spinMin: function($this, increment)
		{
			this._spinMinImpl($this, increment);
			this._trigger("onChangeTime", null, {newTime:this.val()});
		},
		_spinMinImpl: function($this, increment)
		{
			var minCtrl = this.control.find(".minutes"),
			value = parseInt(minCtrl.val());
			if ($this != undefined)
			{
				value = value + (($this.hasClass('siw_prev') ^ this.options.inverseButton)?1:-1);
			}
			if (increment != undefined)
			{
				value = value + increment;
			}
			if (value > 59)
			{
				if (this.options.linkedMinutesHours) this._spinHrsImpl(null, +1);
				value = 0;
			}
			if (value < 0)
			{
				if (this.options.linkedMinutesHours) this._spinHrsImpl(null, -1);
				value = 59;
			}
			value = this._validateMins(value);
			minCtrl.val(value);
			this._recalculate();
		},
		_validateHrs: function(value)
		{
			value = parseInt(value);
			if (this.maxHrs)
			{
				if (value > this.maxHrs && !this.reverseRange) value = this.maxHrs;
				if (value < this.minHrs && !this.reverseRange) value = this.minHrs;
				if (this.reverseRange)
				{
					if (value > this.maxHrs && value < this.minHrs) value = (2*value-this.maxHrs-this.minHrs>0)?this.minHrs:this.maxHrs;
				}
			}
			value = value>=10 ? value : '0'+value;
			if (isNaN(value) || value < 0) value = '00';
			else if (value > 23) value = '23';
			return value;
		},
		_validateMins: function(value)
		{
			value = parseInt(value);
			
			if (this.maxMins)
			{
				var currentHrs = parseInt(this.control.find(".hours").val()),
					sameMaxHrs = currentHrs == this.maxHrs,
					sameMinHrs = currentHrs == this.minHrs;
				if (value > this.maxMins && sameMaxHrs) value = this.maxMins;
				if (value < this.minMins && sameMinHrs) value = this.minMins;
			}
			
			value = value>=10 ? value : '0'+value;
			if (isNaN(value) || value < 0) value = '00';
			else if (value > 59) value = '59';
			return value; 
		},
		_recalculate: function()
		{
			this.element.val(this.val());
		},
		val: function (value)
		{
			if (value != undefined)
			{
				var valArr = value.split(':');
				this.control.find(".hours").val(this._validateHrs(valArr[0]));
				this.control.find(".minutes").val(this._validateMins(valArr[1]));
				return this;
			}
			return this.control.find(".hours").val()+':'+this.control.find(".minutes").val();
		}
	});
})(jQuery);