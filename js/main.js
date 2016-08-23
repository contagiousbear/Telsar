$(document).ready(function() { /*Output Format Selection*/
	$('select').material_select()
	$('.modal-trigger').leanModal()
	$('.scrollbar-chrome').scrollbar()
})

const electron = require("electron").remote /*Save As dialog*/
var dialog = electron.dialog

var inputPath
var outputPath

function selectFile() {

	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{
				name: 'Videos',
				extensions: ['mp4', 'webm']
		 }
	 ]
	}, function(selectedFiles) {
		if (selectedFiles) {
			inputPath = selectedFiles.toString()
		}
		if (inputPath) {
			var fileName = inputPath.split(/\\/g).pop()
			$("#inputPath").val(fileName)
			$('#output').removeClass('disabled')
		} else {
			$("#inputPath").val('')
			$('#output').addClass('disabled')
			$('#outputPath').val('')
			outputPath = false
		}
	})
}


$('#output').click(function() {
	if ($(this).hasClass('disabled')) {
		return
	} else {
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, function(selectedFiles) {
			outputPath = selectedFiles.toString()
			if (outputPath) {
				var format = $('#formatSelect').val()
				$('#outputPath').val(`${outputPath}\\output.${format}`)
			} else {
				$('#outputPath').val('')
			}
		})
	}
})

var ffmpeg = require('fluent-ffmpeg')
var command = ffmpeg()

var double = /[0-9][0-9]:[0-9][0-9]/
var triple = /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/

var videoDur

$('#formatSelect').change(function() {
	var format = $('#formatSelect').val()
	$('#outputPath').val(`${outputPath}\\output.${format}`)
	console.log('passed')
})

function submit() {
	var file = inputPath
	var time = $("#time").val()
	var format = $('#formatSelect').val()
	var quality = $('#qualitySelect').val()
	var resolution = $('#resolution').val()
	var frames = $('#frames').val()
	var volume = $('#volume').prop('checked')


	if (!inputPath) {
		Materialize.toast('Please select a file.', 4000)
	} else if (!time) {
		Materialize.toast('Please choose start time.', 4000)
	} else {
		if (time.length <= 5 && !double.test(time)) {
			Materialize.toast('Please use 00:00 or 00:00:00 format', 4000)
		} else if (time.length > 5 && !triple.test(time)) {
			Materialize.toast('Please use 00:00 or 00:00:00 format', 4000)
		} else {
			var codec
			var bitrate
			var vidSize
			var fps
			var vol

			var secs
			var split = time.split(':')

			var probe = require('node-ffprobe')
			var track = inputPath

			probe(track, function(err, probeData) {
				videoDur = Math.floor(probeData.format.duration)

				if (time.length == 5) {
					secs = +split[0] * 60 + +split[1]
				} else if (time.length == 8) {
					secs = +split[0] * 60 * 60 + +split[1] * 60 + +split[2]
				}
				if (videoDur < secs) {
					Materialize.toast('Time exceeds total video length.', 4000)
				} else {
					if (quality == 'low') {
						bitrate = 1024
					} else if (quality == 'medium') {
						bitrate = 2000
					} else {
						bitrate = 3000
					}

					if (resolution == '360') {
						vidSize = '640x360'
					} else if (quality == '480') {
						vidSize = '848x480'
					} else {
						vidSize = '1280x720'
					}

					if (quality == 'low') {
						bitrate = 1024
					} else if (quality == 'medium') {
						bitrate = 3000
					} else {
						bitrate = 6000
					}

					if (format == 'mp4') {
						codec = 'libx264'
					} else {
						codec = 'libvpx'
					}

					if (frames == '30') {
						fps = '30'
					} else {
						fps = '60'
					}

					if (volume == true) {
						vol = '1'
					} else {
						vol = '0'
					}

					if (!outputPath) {
						var pop = inputPath.split(/\\/g)
						pop.pop()
						outputPath = pop.join('\\') + "\\"
						console.log('a', outputPath)
					}

					options(codec, bitrate, vidSize, fps, vol)
				}
			})
		}
	}
}

function options(codec, bitrate, vidSize, fps, vol) {
	var file = inputPath
	var time = $("#time").val()
	var format = $('#formatSelect').val()

	$('#conver').openModal({
		dismissible: false
	})
	var duration
	var percent = 0
	command = ffmpeg(file)
		.seekInput(`${time}.000`)
		.fps(fps)
		.withVideoCodec(codec)
		.audioFilters(`volume=${vol}`)
		.withVideoBitrate(bitrate)
		.size(vidSize)
		.toFormat(format)
		.on('error', function(err, stdout, stderr) {
			console.log('Cannot process video:', err.message)
		})
		.on('end', function() {
			console.log('Processing finished!');
			$('#conver').closeModal()
			duration = 0
		})
		.on('stderr', function(stderrLine) {
			if (stderrLine.trim().startsWith('Duration:')) {
				var match = stderrLine.trim().match(/Duration:\s\d\d\:\d\d:\d\d/).toString().split('Duration:').slice(1).toString().split(':')
				duration = +match[0] * 60 * 60 + +match[1] * 60 + +match[2]
				var split = time.split(':')
				var trim
				if (time.length == 5) {
					trim = +split[0] * 60 + +split[1]
					duration = duration - trim
				} else if (time.length == 8) {
					trim = +split[0] * 60 * 60 + +split[1] * 60 + +split[2]
					duration = duration - trim
				}
			}
			if (stderrLine.startsWith('frame=')) {
				var match = stderrLine.trim().match(/time=[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/).toString().split('time=').slice(1).toString().split(':')
				var seconds = +match[0] * 60 * 60 + +match[1] * 60 + +match[2]
				var math = seconds / duration
				var percent = (math * 100)
				percent = Math.floor(percent)
				$('#progress').css('width', percent + '%')
				$('#progressNum').html(percent + '%')
			}
		})
		.save(`${outputPath}\\output.${format}`)
}

function killConver() {
	command.kill('SIGTERM')
	console.log('success')
}
