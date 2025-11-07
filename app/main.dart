import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tank Status Monitor',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const SmsListenerPage(),
    );
  }
}

class SmsListenerPage extends StatefulWidget {
  const SmsListenerPage({Key? key}) : super(key: key);

  @override
  State<SmsListenerPage> createState() => _SmsListenerPageState();
}

class _SmsListenerPageState extends State<SmsListenerPage> {
  static const platform = MethodChannel('com.example.sms_listener/sms');

  String _gsmNumber = '+919477399134'; // Your GSM module number
  String _backendUrl = 'http://10.10.118.246:5000/update_status';

  String _latestSms = 'No SMS received yet';
  String _location = '';
  String _status = '';
  String _height = '';
  bool _isListening = false;
  String _logMessage = '';

  final TextEditingController _gsmController = TextEditingController();
  final TextEditingController _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _gsmController.text = _gsmNumber;
    _urlController.text = _backendUrl;
    _setupSmsListener();
  }

  void _setupSmsListener() {
    platform.setMethodCallHandler((call) async {
      if (call.method == 'onSmsReceived') {
        final String sender = call.arguments['sender'];
        final String message = call.arguments['message'];

        if (sender == _gsmNumber) {
          _handleSms(message);
        }
      }
    });
  }

  Future<void> _requestPermissions() async {
    final status = await Permission.sms.request();

    if (status.isGranted) {
      _showLog('SMS permission granted');
      await _startListening();
    } else if (status.isDenied) {
      _showLog('SMS permission denied');
      _showSnackBar('SMS permission is required to receive messages');
    } else if (status.isPermanentlyDenied) {
      _showLog('SMS permission permanently denied');
      openAppSettings();
    }
  }

  Future<void> _startListening() async {
    try {
      await platform.invokeMethod('startListening');
      setState(() {
        _isListening = true;
      });
      _showLog('Started listening for SMS');
    } on PlatformException catch (e) {
      _showLog('Failed to start listening: ${e.message}');
    }
  }

  Future<void> _stopListening() async {
    try {
      await platform.invokeMethod('stopListening');
      setState(() {
        _isListening = false;
      });
      _showLog('Stopped listening for SMS');
    } on PlatformException catch (e) {
      _showLog('Failed to stop listening: ${e.message}');
    }
  }

void _handleSms(String message) {
  setState(() {
    _latestSms = message;
  });

  // Remove "Jio Alert : SPAM" and blank lines
  message = message.replaceAll("Jio Alert : SPAM", "").trim();

  // Expected format:
  // TANK-1:GREEN | H=17.8c,
  final regex = RegExp(r'^(TANK-\d+):(\w+)\s*\|\s*H=([\d.]+)', caseSensitive: false);
  final match = regex.firstMatch(message);

  if (match != null) {
    final location = match.group(1)!;
    final status = match.group(2)!.toUpperCase();
    final height = double.tryParse(match.group(3)!) ?? 0.0;

    setState(() {
      _location = location;
      _status = status;
    });

    _showLog('Parsed: $location -> $status ($height cm)');
    _sendToBackend(location, status, height);
  } else {
    _showLog('Invalid message format: $message');
    _showSnackBar('Invalid SMS format.');
  }
}


 Future<void> _sendToBackend(String location, String status, double level) async {
  final String backendUrl = _backendUrl;

  try {
    final response = await http.post(
      Uri.parse(backendUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'location': location,
        'status': status,
        'level': level,
      }),
    );

    if (response.statusCode == 200) {
      _showLog('✅ Sent: $location -> $status ($level cm)');
      _showSnackBar('Status updated successfully', Colors.green);
    } else {
      _showLog('⚠ Backend error ${response.statusCode}');
      _showSnackBar('Failed to update backend', Colors.orange);
    }
  } catch (e) {
    _showLog('❌ Network error: $e');
    _showSnackBar('Network error: Check backend URL or Wi-Fi', Colors.red);
  }
}

  String _two(int n) => n.toString().padLeft(2, '0');

  void _showLog(String message) {
    setState(() {
      _logMessage = '${DateTime.now().toString().substring(11, 19)}: $message';
    });
    print(message);
  }

  void _showSnackBar(String message, [Color? color]) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'GREEN':
        return Colors.green;
      case 'YELLOW':
        return Colors.amber;
      case 'RED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tank Status Monitor')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Configuration',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _gsmController,
                      decoration: const InputDecoration(
                        labelText: 'GSM Module Number',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.phone),
                      ),
                      onChanged: (v) => _gsmNumber = v,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'Backend URL',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.cloud),
                      ),
                      onChanged: (v) => _backendUrl = v,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isListening ? _stopListening : _requestPermissions,
              icon: Icon(_isListening ? Icons.stop : Icons.play_arrow),
              label:
                  Text(_isListening ? 'Stop Listening' : 'Start Listening'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: _isListening ? Colors.red : Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color:
                  _status.isNotEmpty ? _getStatusColor(_status).withOpacity(0.1) : null,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text('Current Status',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
                          const Spacer(),
                          if (_status.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: _getStatusColor(_status),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(_status,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_location.isNotEmpty)
                        Text('Tank: $_location (${_height} cm)',
                            style: const TextStyle(fontSize: 16)),
                      const Divider(),
                      const Text('Latest SMS:',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(_latestSms,
                          style: const TextStyle(
                              fontSize: 14, color: Colors.black87)),
                    ]),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Activity Log',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(
                        _logMessage.isEmpty ? 'No activity yet' : _logMessage,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                          fontFamily: 'monospace',
                        ),
                      ),
                    ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _gsmController.dispose();
    _urlController.dispose();
    super.dispose();
  }
}