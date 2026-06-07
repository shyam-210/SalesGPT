# Virtual Fencing Mini Project Report (Template Reference)

Source: d:/VirtualFencingFinal/VirtualFencingReport.docx

AI-Powered Virtual Fencing
Real Time Intrusion Detection System

A MINI PROJECT REPORT

Submitted by
Shyam J (910622108050)
Dhatchin SS (910622108008)
Mohammed Fardin A (910622108028)

In partial fulfilment for the award of the degree
of
BACHELOR OF TECHNOLOGY
in
ARTIFICIAL INTELLIGENCE & DATA SCIENCE

K.L.N. COLLEGE OF ENGINEERING, POTTAPALAYAM
### (An Autonomous Institution, Affiliated to Anna University Chennai)

ANNA UNIVERSITY : CHENNAI 600 025
November 2025
K.L.N COLLEGE OF ENGINEERING
(An Autonomous Institution, Affiliated to Anna University, Chennai)

BONAFIDE CERTIFICATE
Certified that this project report “AI-Based Virtual Fencing System: Real Time Intrusion Detection System” is the bona-fide work of  “Shyam J (Reg. No. 910622108050) , Dhatchin SS(Reg. No 910622108008), Mohammed Fardin A(Reg. No. 910622108028)” who carried out the project work under my supervision



| SIGNATURE | SIGNATURE |
| --- | --- |
|   |   |
| Dr . S. Suresh Raja | Dr . S. Suresh Raja |
| M.C.A., M.PHIL.(COMP.SCI.). M.E.(CSE), PH.D | M.C.A., M.PHIL.(COMP.SCI.). M.E.(CSE), PH.D |
| HEAD OF THE DEPARTMENT | HEAD OF THE DEPARTMENT |
| ARTIFICIAL INTELLIGENCE | ARTIFICIAL INTELLIGENCE |
| AND DATA SCIENCE | AND DATA SCIENCE |
|   |   |
| K.L.N. COLLEGE OF ENGINEERING | K.L.N. COLLEGE OF ENGINEERING |
| (An ISO 9001-2008 Certified Institution) | (An ISO 9001-2008 Certified Institution) |
| POTTAPALAYAM, SIVAGANGAI, | POTTAPALAYAM, SIVAGANGAI, |
| TAMIL NADU, INDIA. | TAMIL NADU, INDIA. |




Submitted for the mini project work viva-voce examination held on






Internal Examiner	External Examiner


ACKNOWLEDGEMENT

Any work would be unfulfilled without a word of thanks. We hereby take pleasure in acknowledging the persons who guided me throughout our work.

First and foremost, thanks are to the omnipotent for providing with his abundant blessings all throughout. We all extend our heartfelt thanks to Er. K. N. K. KARTHIK, B.E., President of our college and Dr . A. V. RAMPRASAD, M.E., Ph.D., Principal for provisioning us with the all required.

We esteem our self to articulate our sincere thanks to Dr . S. SURESH RAJA, Head of the Artificial Intelligence and Data Science for leading towards the zenith of success.

We express our grateful thanks to our Project Guide Dr . S. SURESH RAJA, M.C.A., M.PHIL.(COMP.SCI.). M.E.(CSE), PH.D, and Project Coordinator Dr. S. BALAMURUGAN, B.E.(EEE)., M.TECH (C&I)., PH.D., for their invaluable guidance and  motivation. Their assistance and advices had been very helpful throughout our project. I would like to thank all teaching and non-teaching staffs of our department who have been the sources of encouragement and ideas. I thank them for lending their support whenever needed.
ABSTRACT
The AI-Based Virtual Fencing System is an intelligent real-time surveillance solution designed to enhance security through software-defined virtual boundaries rather than traditional physical fences. The primary objective of this project is to automate the monitoring of restricted zones and instantly detect any unauthorized intrusion using deep learning and computer vision. This system provides a cost-effective, scalable, and flexible alternative to conventional surveillance methods, eliminating the need for continuous human observation or expensive physical infrastructure.
In today’s world, physical security measures are often inadequate or impractical for large areas such as college campuses, agricultural fields, or industrial perimeters. Manual monitoring is prone to fatigue, delay, and human error. Therefore, there is a strong need for an AI-driven system capable of real-time, autonomous, and intelligent detection of intrusions without physical barriers. The Virtual Fencing System addresses these challenges by integrating artificial intelligence and automation to provide instant alerts and visual proof whenever a breach occurs, ensuring proactive response and heightened situational awareness.
The project is implemented using Flask as the backend framework, providing a lightweight yet robust structure for web routing, database handling, and process communication. The system utilizes OpenCV to handle live video streams from multiple cameras and allows the user to define custom virtual fences interactively by drawing lines or boundaries on the video frame. Each camera feed operates under an independent multiprocessing worker, enabling parallel video decoding, object detection, and intrusion analysis. This architecture effectively overcomes Python’s Global Interpreter Lock (GIL), ensuring seamless real-time performance across up to four cameras simultaneously.
Upon detecting motion or an object crossing the virtual fence, the system captures an intrusion snapshot and logs the event into a local SQLite database. Simultaneously, a real-time WhatsApp alert is triggered using Twilio API integrated with Ngrok, sending detailed information such as camera ID, timestamp, and intrusion image to the user’s mobile device. This transforms the system from a passive surveillance tool into an active, intelligent alerting system.


LIST OF FIGURES
| Figure No. | Title |
| --- | --- |
| Fig 1.1 | System Architecture of Virtual Fencing System |
| Fig 3.1 | Flow Diagram of YOLOv8-based Intrusion Detection |
| Fig 5.1 | Multi-Camera Stream Dashboard |
| Fig 5.2 | Fence Drawing Interface (OpenCV Window) |
| Fig 5.3 | Intrusion Detection Snapshot (YOLOv8 Output) |
| Fig 5.4 | WhatsApp Intrusion Alert Notification |
| Fig 5.5 | Logs and Snapshot Management Page |


LIST OF ABBREVIATIONS
| AI : Artificial Intelligence | YOLO : You Only Look Once |
| --- | --- |
| FPS : Frames Per Second | CPU : Central Processing Unit |
| GPU : Graphics Processing Unit | GIL : Global Interpreter Lock |
| JSON : JavaScript Object Notation | API : Application Programming Interface |
| GUI : Graphical User Interface | IPC : Inter-Process Communication |
| DB : Database | SMTP : Simple Mail Transfer Protocol |
| Ngrok : Network Tunneling Utility for Exposing Local Servers | RTSP : Real-Time Streaming Protocol |
| ID : Identification Number | IoT : Internet of Things |




TABLE OF CONTENTS

| Chapter No | Title | Page No |
| --- | --- | --- |
| — | ABSTRACT | i |
| — | LIST OF FIGURES | ii |
| — | LIST OF ABBREVIATIONS | ii |
| 1 | INTRODUCTION | 1 |
| 1.1 | Introduction | 1 |
| 1.2 | Problem Statement | 1 |
| 1.3 | Objectives of the Project | 2 |
| 1.4 | Scope of the Project | 3 |
| 1.4.1 | Existing System | 4 |
| 1.4.2 | Proposed System | 4 |
| 1.5 | Usefulness / Relevance to the Society | 6 |
| 2 | LITERATURE REVIEW | 7 |
| 3 | SYSTEM ANALYSIS AND DESIGN | 13 |
| 3.1 | System Architecture | 13 |
| 3.2 | Hardware and Software Specifications | 14 |
| 3.2.1 | Hardware Requirements | 15 |
| 3.2.2 | Software Requirements | 15 |
| 3.3 | Functional and Non-Functional Requirements | 16 |
| 3.4 | Module Specification | 17 |
| 3.4.1 | Data Pre-Processing | 17 |
| 3.4.2 | Segmentation | 18 |
| 3.4.3 | Feature Extraction | 18 |
| 3.4.4 | Feature Selection | 19 |
| 3.4.5 | Classifier Comparison Analysis | 20 |
| 4 | IMPLEMENTATION | 22 |
| 4.1 | Coding | 23 |
| 5 | TESTING AND RESULTS | 31 |
| 5.1 | System Testing | 31 |
| 5.1.1 | Unit Testing | 31 |
| 5.1.2 | Integration Testing | 32 |
| 5.1.3 | Performance Testing | 32 |
| 5.2 | Output Screenshots | 33 |
| 5.3 | Performance Evaluation | 37 |
| 5.4 | Discussion on Results | 38 |
| 6 | CONCLUSION AND FUTURE ENHANCEMENT | 39 |
| 6.1 | Conclusion | 39 |
| 6.2 | Future Enhancement | 40 |
| 7 | REFERENCES | 41 |




CHAPTER 1
INTRODUCTION
1.1 INTRODUCTION
The security landscape is rapidly shifting towards proactive, AI-driven systems. Advanced computer vision and deep learning, particularly object detection with Convolutional Neural Networks (CNNs), now enable real-time identification of objects like people and vehicles, moving surveillance beyond passive recording. However, current AI security solutions often lack affordability, flexibility, or dynamic adaptability. This project introduces the AI-Based Virtual Fencing System: Real Time Intrusion Detection System to bridge this gap, offering a local-first, open-source solution that combines cutting-edge AI detection with user-friendly, on-the-fly virtual fence definition. This innovative approach provides superior flexibility and cost-effectiveness over traditional physical barriers.
1.2 PROBLEM STATEMENT
Despite technological advancements in cameras, the core issues in security monitoring often relate to the cost, inflexibility, and inefficiency of traditional methods:
- Inefficiency of Physical Fences: High cost, static, difficult to relocate/maintain, and easily bypassed..
- Inefficiency of Manual Monitoring: Labour-intensive, costly, prone to human error (fatigue/distraction), leading to missed events and slow responses.
- Computational Overhead: real-time object detection across multiple cameras is resource-intensive, risking lag, dropped frames, and system crashes without efficient management.
- Alerting Delay: Traditional alert methods (email, proprietary apps) are slow; there's a critical need for instant, actionable alerts via high-engagement platforms like WhatsApp.
1.3 OBJECTIVES OF THE PROJECT
The primary objectives for the development and implementation of the AI-Based Virtual Fencing System are:
- Create a Flask web interface for intuitive management and monitoring.
- Implement YOLOv8n for high-FPS, CPU-efficient object detection.
- Allow users to dynamically draw virtual fences on live feeds using OpenCV.
- Support 2-4 simultaneous camera feeds via Python's multiprocessing for parallel processing.
- Log all detection events with essential metadata (timestamp, camera ID, class, bounding box).
- Store local snapshots of intrusion events for visual evidence.
- Send real-time WhatsApp alerts with media via Twilio/Ngrok.
- Provide a web dashboard for live feeds and historical logs.





1.4 SCOPE OF THE PROJECT
This project focuses on delivering a fully functional prototype with the
following defined boundaries:
In-Scope:
- The system supports up to 4 concurrent cameras (local USB or RTSP feeds).
- Object detection is limited to specific predefined classes (e.g., 'person', 'car', 'animal') using a pre-trained YOLOv8 model.
- The system is designed as a prototype deployed on a single local machine; it is not configured for cloud-native or containerized (Docker) deployment.
- The primary alert mechanism is exclusively through WhatsApp using the Twilio API.
- The system uses the lightweight, efficient multiprocessing for concurrency rather than GPU-specific optimization tools (like CUDA).
Out-of-Scope:
- Cloud-native deployment, scaling, or management (e.g., using AWS/GCP/Azure).
- Advanced object tracking algorithms (like DeepSORT) to identify and distinguish unique individuals across frames.
- Development of a dedicated mobile application for remote viewing or control.


1.4.1 EXISTING SYSTEM
Current security solutions typically fall into three categories:
- System 1: Physical Fences + Guards. This method offers a high physical deterrent. However, its drawbacks include extremely high initial cost, fixed boundaries that cannot be dynamically adjusted, and ongoing high operational expenses for human guards who are still susceptible to fatigue.
- System 2: "Dumb" CCTV + Digital Video Recorder (DVR). This is the most common digital system. Its main advantage is that it records evidence. Its primary limitation, however, is that it is 100% passive. It provides no real-time intelligence or alerts, meaning intrusion events are often only discovered long after they occur, turning it into a forensic tool rather than a preventative one.
- System 3: Basic Motion Detection. Many IP cameras offer rudimentary, pixel-based motion detection. This system is proactive, generating alerts when pixel values change. The significant disadvantage is the high false-positive rate (FPR), triggering alerts for wind, shadows, rain, or small animals, leading to "alert fatigue" among operators who quickly learn to ignore the constant stream of useless notifications.
1.4.2 PROPOSED SYSTEM
The proposed system addresses the limitations of existing solutions by             integrating AI-driven intelligence, parallelism, and a robust alert mechanism. The user journey defines the system's architecture:
- System Initialization: Flask app starts, spawning a CameraProcess worker for each camera.
- Fence Definition: User draws a polygonal fence on a live stream via an OpenCV window.
- Configuration Saving: Fence coordinates are saved to a JSON file.
- Real-Time Detection: Each CameraProcess continuously runs YOLOv8 detection on frames.
- Intrusion Logic: The system checks if the centroid of any detected object falls within the defined virtual fence using cv2.pointPolygonTest.
- Alert Queueing: Confirmed intrusions trigger a snapshot and metadata packet, pushed to a shared multiprocessing.Queue.
- Alert & Logging Consumption: A dedicated AlertProcess saves the snapshot/metadata locally, generates a public image URL via Ngrok, and sends an API call to Twilio.
- Instant Notification: The user receives an immediate WhatsApp alert with the intrusion message, metadata, and snapshot.





1.5 RELEVANCE TO SOCIETY
The AI-Based Virtual Fencing System offers significant societal and industrial relevance:
- Home and Small Business Security: It provides a low-cost, smart monitoring upgrade for existing CCTV systems, democratizing access to powerful AI tools that were once exclusive to large enterprises.
- Industrial and Public Safety: The system can detect unauthorized access to critical areas, such as railway tracks, power stations, chemical storage facilities, or construction sites, preventing accidents and theft.
- Agriculture and Environmental Monitoring: It can be deployed to monitor farm perimeters for trespassers, deter livestock from protected ecological zones, or track animal movements for research.
- Efficiency and Operator Safety: By filtering out false alarms (like shadows or wind) and delivering only actionable, high-priority alerts, the system frees human operators to focus their attention on real threats, reducing alert fatigue and improving overall response efficiency.





## CHAPTER 2
## LITERATURE REVIEW
### 2.1 Overview of Surveillance Systems
Surveillance technology has undergone several radical shifts, moving from purely reactive data acquisition to proactive, intelligent event processing. This evolution is often characterized by three main generations:
First Generation: Analog and Passive Systems This era was dominated by Analog Closed-Circuit Television (CCTV) systems. Video signals were captured by low-resolution cameras, transmitted over coaxial cables, and recorded onto Digital Video Recorders (DVRs).
- Key Characteristic: Physical presence, local storage, and passive monitoring.
- Limitation: Required dedicated human oversight and manual review of footage to identify events. The system was a data collector, not an information generator.
Second Generation: Digital and Networked Systems The advent of Internet Protocol (IP) cameras and centralized network video recorders (NVRs) redefined surveillance. Systems became networked, scalable, and digital, allowing for remote access and digital storage.
- Key Characteristic: Networked accessibility (RTSP streams), higher resolution, and increased scalability.
- Limitation: Intelligence remained minimal. Basic video analytics, such as rudimentary motion detection or pixel change algorithms, led to an extremely high rate of false positives (e.g., shadows, rain, waving trees), resulting in severe alert fatigue for human operators.

Third Generation: Intelligent and Proactive Systems (AI-Driven) The current generation leverages advances in deep learning (DL) and computer vision to imbue surveillance systems with true intelligence. Convolutional Neural Networks (CNNs) enable the system to understand what it is seeing (object detection and classification) rather than just that something moved. This fundamentally transforms the system from a monitoring tool into an active decision-support system.
The functional pillars of this AI-driven generation are central to the proposed project:
- Semantic Filtering (Event Filtering): The ability to filter the raw video stream and focus only on meaningful, predefined events (e.g., ignoring a cat but alerting on a 'person' or 'car').
- Real-Time Interpretation: Providing immediate, context-rich insights (e.g., "A person entered the restricted zone at 15:45:22 IST").
- Automation: Triggering external, actionable responses (such as instantaneous mobile alerts, as implemented in this project) without requiring human intervention for event classification.
### 2.2 Review of Object Detection Models
Accurate, real-time object detection is the core technical enabler of intelligent surveillance. Detection algorithms are broadly classified based on their processing workflow:


| Category | Typical Model | Pros | Cons |
| --- | --- | --- | --- |
| Two-Stage Detectors | Faster R-CNN | Highest accuracy, good for complex scenes. | Slow (typically < 5 FPS), computationally expensive. |
| One-Stage Detectors | YOLO, SSD | Fastest inference speed, good for real-time video. | Historically lower accuracy than two-stage models. |


The You Only Look Once (YOLO) family of models, created by Joseph Redmon, represents the gold standard for high-performance, single-stage object detection. Its fundamental innovation is predicting bounding boxes and class probabilities simultaneously in a single pass over the image.
Justification for YOLOv8 (Ultralytics) The project selects YOLOv8 as the detection backbone due to its architectural and performance benefits over prior generations (YOLOv5, YOLOv7):
- Anchor-Free Architecture: YOLOv8 moved away from predefined anchor boxes, allowing it to predict the center of an object directly. This simplifies the post-processing and leads to faster, more robust detection.
- State-of-the-Art Performance: YOLOv8 offers a superior Speed-Accuracy Trade-off (measured by mAP/FPS ratio).
- Resource Optimization (YOLOv8n): The nano variant (yolov8n.pt) is specifically optimized for CPU and edge device execution. Given the project's non-functional requirement to maintain multi-camera concurrency on standard PC hardware, this choice is optimal, maximizing Frames Per Second (FPS) while retaining high accuracy for the key detection classes (person, car).
### 2.3 Review of Virtual Fencing Concepts
Virtual Fencing (or Digital Tripwires) transforms the traditional, linear logic of a perimeter tripwire into a highly customizable, geometric software boundary. These fences do not rely on physical hardware (like laser sensors) but on image processing and object geometry.
A. Geometric Intrusion Methods
- Bounding Box Overlap: Checks if any part of the detected object's bounding box intersects with the defined polygonal fence area.
- Limitation: Highly prone to false positives, as a person merely walking near the fence or extending an arm can trigger an alert, even if their body mass is safely outside the boundary.
- Centroid Check (Point Near Line String): This method only triggers an intrusion if the calculated centroid (centre point) of the detected object has crossed the boundary line string.
- Advantage: Provides a superior, robust confirmation of true intrusion, as it verifies the core body mass has crossed the line string, drastically reducing false positives.
B. Algorithmic Implementation The Point-in-Linw test is efficiently solved using:
- OpenCV's cv2.pointPolygonTest: This function is a highly optimized, native method used to determine the relative position of a point to a contour. A positive result indicates the point is inside the polygon, making it the fastest and most direct approach for this project's core logic.
- Shapely Library: While more complex, Shapely offers geometric precision for boundary intersection but introduces an external dependency that is typically slower than native OpenCV calls for simple point-in-polygon checks. The project prioritizes the low-latency OpenCV implementation.
### 2.4 Research Gap Identified
While the technical components (YOLOv8, OpenCV) exist as open-source tools, a significant gap remains in integrating them into a viable, end-to-end security solution that addresses real-world operational challenges:
- Concurrency and Scalability: Most open-source prototypes are single-camera, single-thread demonstrations. They fail when processing multiple high-resolution streams simultaneously, crippling the system with Python’s Global Interpreter Lock (GIL). Gap: Lack of a production-style, multiprocessing architecture using Python's native concurrency tools to handle multiple camera streams and maximize CPU core utilization.
- Dynamic Configuration: Commercial systems allow fences to be drawn graphically. Fragmented open-source tools often require fence coordinates to be manually entered in code. Gap: The absence of a simple, GUI-driven, persistent fence drawing mechanism (leveraging OpenCV's setMouseCallback) integrated seamlessly with a web dashboard (Flask).
- Instant and Mainstream Alerting: Solutions often rely on email or passive logging, which is insufficient for real-time security. Gap: Lack of integration with mainstream, instant, media-rich mobile communication channels like WhatsApp, requiring external services like Twilio and secure tunneling (Ngrok) for functionality.
The proposed system is designed specifically to fill this void by integrating these three critical, production-focused features into a single, open-source, resource-efficient prototype

### 2.5 Summary of Findings
The literature review validates the shift towards intelligent, AI-driven surveillance. YOLOv8 is confirmed as the ideal object detection model for CPU-limited, real-time applications, offering a high-performance anchor-free architecture. The centroid-based point-in-polygon check provides the most accurate and robust intrusion logic, solvable efficiently via OpenCV.
The project directly leverages these validated findings to build a practical, open-source system focusing on multiprocessing concurrency, dynamic fence definition, and instant mobile communication to deliver a feature-rich, high-performance solution that addresses the identified market gap.












CHAPTER 3
SYSTEM ANALYSIS AND DESIGN
3.1 SYSTEM ARCHITECTURE
The system is a Flask-based web application that functions as a control panel and monitoring interface. Its core strength lies in its ability to manage multiple independent camera worker processes using Python's multiprocessing. This architecture allows the computationally intensive tasks of video decoding and object detection to run in parallel on separate CPU cores, maintaining high throughput. The overall operation follows a defined loop: Capture → Detect → Check → Alert → Log. All communication of critical events between the workers and the main application occurs through a shared, thread-safe multiprocessing.Queue, ensuring non-blocking performance.
The system employs a client-server architecture with a clear separation of duties handled by distinct processes:
3.2 HARDWARE AND SOFTWARE REQUIREMENTS
3.2.1 HARDWARE REQUIREMENTS
The system is designed to prioritize CPU performance for parallel processing.
Table 3.3.1: Hardware Requirements
| Component | Minimum Specification | Recommended Specification |
| --- | --- | --- |
| CPU | Intel Core i5 (4-core, 8th gen equivalent) | Intel Core i7 / Ryzen 7 (8-core/16-thread) |
| RAM | 8 GB DDR4 | 16 GB DDR4 (or higher) |
| Storage | 10 GB Free Space (SSD recommended) | 256 GB SSD (for fast logging) |
| Camera | USB Webcam or 720p RTSP IP Camera | 1080p RTSP IP Camera (H.264 compression) |
| Network | Stable Broadband Connection (for Ngrok/Twilio) | High-Speed LAN (for camera streams) |









3.2.2 SOFTWARE REQUIREMENTS
The application relies entirely on open-source Python libraries and external API services.
Table 3.2: Software Requirements
| Type | Name | Purpose |
| --- | --- | --- |
| Operating System | Windows 10/11, Ubuntu 20.04+, macOS | Operating environment for Python |
| Language | Python 3.10+ | Primary development language |
| Web Framework | Flask | Backend API and Web UI server |
| Computer Vision | opencv-python | Video capture, frame manipulation, geometric tests (pointPolygonTest) |
| Deep Learning | ultralytics | YOLOv8 object detection |
| Concurrency | multiprocessing | Parallel processing of camera streams |
| Data Manipulation | numpy, json | Array manipulation and data logging |
| Notifications | twilio | WhatsApp API integration |
| External Service | Ngrok (Tunneling) | Expose local server for Twilio access |
| Configuration | python-dotenv | Environment variable management (API Keys) |


3.3 FUNCTIONAL AND NON FUNCTIONAL REQUIREMENTS
Functional Requirements
The system must perform the following core, measurable functions:
- FR1 (Camera Management): The system shall allow the operator to add a new camera source (RTSP URL or device ID) via the configuration file.
- FR2 (Live View): The system shall display live MJPEG video feeds from all active cameras on a central web dashboard.
- FR3 (Fence Drawing): The user shall be able to initiate and draw a Line String fence on a selected live feed via an interactive OpenCV window.
- FR4 (Fence Control): The user shall be able to reset/clear or save the drawn fence coordinates.
- FR5 (Detection): The system shall run YOLOv8 detection on every frame for specific, configured object classes.
- FR6 (Intrusion Check): The system shall trigger an alert if the centroid of a detected object enters the area defined by the Line String fence coordinates.
- FR7 (Snapshot): The system shall save a high-resolution snapshot image of the frame at the moment of intrusion.
- FR8 (WhatsApp Alert): The system shall send a WhatsApp message containing the snapshot image and event details via the Twilio API.
- FR9 (Logging): The system shall log all alert events to the local file system using the JSON format, including timestamp and metadata.
- FR10 (History): The user shall be able to view a historical log of all alerts and corresponding snapshots on a dedicated web page.

NON-FUNCTIONAL REQUIREMENTS
These requirements define the operational quality and constraints of the system:
- Performance: Achieve at least 5 FPS detection across 4 cameras and under 10 seconds alert latency.
- Reliability: The Flask app must remain stable even if camera workers or feeds fail.
- Usability: Intuitive web interface and accurate, simple fence drawing mechanism.
- Concurrency: All camera feeds must be processed in parallel using multiprocessing to fully utilize CPU cores.
- Security (Limitation): Acknowledge Ngrok's public, unauthenticated endpoint as a security risk for the prototype.
3.4 MODULE SPECIFICATION
3.4.1 DATA PRE- PROCESSING
Data pre-processing is the critical initial stage that transforms raw input              into a clean, normalized format suitable for the machine learning model. The quality of the input data directly dictates the performance and convergence     speed of the algorithm. This module encompasses several key operations:
- Image Standardization and Normalization: Input images are uniformly resized (e.g., 640 \times 640 pixels) for CNN consistency. Pixel intensity values (0-255) are normalized to [0, 1] by dividing by 255. This normalization is vital for stable training and faster algorithm convergence.
- Data Augmentation: To enhance the model's generalization and robustness to real-world variations, synthetic data augmentation techniques are applied. These include random rotation, horizontal flipping, contrast adjustments, and minor scaling or cropping. This effectively expands the training dataset's size and diversity without requiring new raw data collection.
- Label Encoding: Ground truth labels, such as bounding box coordinates and class names, are converted into a machine-readable format compatible with YOLOv8. This involves normalizing bounding box coordinates and assigning integer indices to class categories, ensuring the data is correctly structured for model input.
3.4.2 SEGMENTATION
Segmentation isolates the Region of Interest (ROI) for object detection, significantly reducing computational load by minimizing irrelevant processing.
- Background Subtraction (Optional): For static cameras, algorithms like MOG2 can differentiate moving foreground objects from the static background, creating a binary mask. This focuses subsequent detection on potential targets, boosting processing speed.
- Region of Interest (ROI) Limiting: A fixed ROI can be pre-defined (e.g., specific frame area) to reduce the processing space before heavy algorithms run. In this project, the dynamic Virtual Fence acts as the primary ROI filter after detection, but initial frame-level filtering can be used for further optimization.

3.4.3 FEATURE EXTRACTION
Feature extraction is the process by which the model identifies and quantifies distinct, meaningful characteristics from the segmented image data. In modern deep learning, this process is largely automated within the chosen CNN architecture (YOLOv8), which functions as a feature extractor.
- Convolutional Layers: YOLOv8's backbone automatically extracts hierarchical features, from low-level details (edges, textures) in early layers to high-level semantic parts (object components) in deeper layers.
- Feature Map Generation: The network produces feature maps (tensors) that spatially encode these extracted features, which are then used by the detection head for final predictions.
- Bounding Box and Confidence Scores: The final "features" extracted for the intrusion logic are:
- The (x1, y1, x2, y2) bounding box coordinates.
- The class label (e.g., 'person', 'car').
- The confidence score associated with the prediction.
3.4.4 FEATURE SELECTION
Feature selection typically applies to traditional machine learning to reduce model complexity and prevent overfitting by choosing only the most impactful features. In the context of a contemporary deep learning architecture like YOLOv8, feature selection primarily occurs post-inference.
- Confidence Thresholding: Discards detections below a set confidence (e.g., 50%), ensuring only high-quality, reliable features are passed to intrusion logic.
- Class Filtering: Since the virtual fence only needs to detect specific threats (e.g., 'person', 'car'), the feature set is immediately filtered to include only these configured classes, discarding all other irrelevant detections (e.g., 'traffic light', 'cup').

3.4.5 CLASSIFIER COMPARISON ANALYSIS
This module, while primarily a design and evaluation phase rather than an ongoing operational component, is essential for justifying the selection of YOLOv8. The analysis compares YOLOv8's performance against alternative models based on the project’s specific constraints (CPU-bound real-time monitoring).

The comparison should focus on three key performance metrics:
- Speed (Inference Time/FPS): Crucial for real-time performance on target CPU hardware.
- Accuracy (mAP - Mean Average Precision): Evaluates precision and recall across relevant classes using standard datasets.
- Efficiency (Model Size): Compares model complexity (parameters, file size) impacting memory and deployment.

| Classifier Model | Architecture Type | Key Metric for Project | Rationale for Selection/Rejection |
| --- | --- | --- | --- |
| YOLOv8n (Selected) | One-Stage Detector | Highest FPS on CPU | Optimal balance of speed and acceptable mAP for real-time security. |
| Faster R-CNN | Two-Stage Detector | Highest Accuracy (mAP) | Rejected: Too slow (low FPS) for CPU-based real-time application due to the two-stage proposal process. |
| YOLOv5s | One-Stage Detector | High FPS, Good mAP | Competitor: Slightly slower and less accurate than YOLOv8 at comparable sizes, making YOLOv8 the SOTA choice. |

This comparison confirms that the chosen classifier, YOLOv8n, provides the best trade-off, prioritizing the high Frames Per Second (FPS) necessary for the multi-camera, real-time virtual fencing system.








CHAPTER 4
IMPLEMENTATION
IMPLEMENTATION
The development followed an iterative, staged approach:
- Core Proof-of-Concept: Validated basic workflow (YOLOv8 inference, centroid calculation, cv2.pointPolygonTest) with a single-threaded script.
- Web Interface Integration: Introduced Flask to display video streams via MJPEG in a web browser.
- Concurrency Refactoring (Critical): Converted single-stream logic to multiprocessing.Process with a shared multiprocessing.Queue for inter-process communication of alert data.
- Configuration and Control: Integrated OpenCV mouse callback with Flask routes to dynamically save fence coordinates to JSON files.
- External Services Integration: Developed an AlertProcess to consume the queue, log snapshots/metadata locally, and integrate Twilio/Ngrok for WhatsApp alerts.
- External Services Integration: The AlertProcess was created to consume the queue, implement the local logging of snapshots and metadata, and integrate the Twilio API with Ngrok for outbound WhatsApp messaging.



4.1 CODING
Folder Structure Overview
The project adheres to a clean, modular structure to separate concerns and facilitate maintainability:
VirtualFencing/
│
├── instance/
│   └── fences.db                → SQLite database storing fence coordinates and configurations
│
├── static/                      → Contains all static assets for the web interface
│   ├── css/                     → Cascading Style Sheets for styling the web pages
│   ├── images/                  → Image assets used in the web templates
│   ├── intrusion_snaps/         → Stores intrusion snapshots captured by the detection system
│   └── js/                      → JavaScript files for client-side interactivity
│
├── templates/                   → HTML templates rendered by Flask
│   ├── base.html                → Base layout file containing shared structure and navigation
│   ├── camera_view.html         → Displays live video feed from a selected camera
│   ├── cameras.html             → Camera configuration and management page
│   ├── home.html                → Landing page for system overview and quick actions
│   ├── logs.html                → Displays logs of all detected intrusions with timestamps
│   ├── saved_snaps.html         → Lists previously captured intrusion snapshots
│   └── view_snap.html           → Page for viewing individual snapshots in detail
│
├── .env                         → Environment configuration file (Twilio credentials, ngrok URL, etc.)
├── .gitignore                   → Specifies files and directories to be ignored by Git
│
├── camera_tests.py              → Script for testing and validating camera input streams
├── detection_utils.py           → Utility functions for YOLOv8 detection and polygon-based intrusion logic
├── dirStruct                    → Placeholder or reference file for folder structure documentation
├── extensions.py                → Flask extensions and app factory integrations
├── image_enhancement.py         → Functions for improving frame quality before detection
├── models.py                    → Database models and ORM (SQLAlchemy) definitions
├── OverView.md                  → Markdown overview of the project setup and functionality
├── requirements.txt             → Python dependencies required to run the project
├── routes.py                    → Flask route definitions for all pages and API endpoints
├── run.py                       → Main entry point to start the Flask application
│
└── yolov8n.pt                   → Pre-trained YOLOv8 model weights for object detection
Camera handling with multiprocessing
The concurrency solution is built around the multiprocessing module. The main Flask app initializes the shared queue and then iterates through a list of camera configurations, spawning a new process for each.
Code Snippet: Main Process Spawning (Conceptual)
All the active cameras from the Database is fetched. For each fetched camera from the Database, A thread is created and the background detection starts. The `run_background_detection` method starts each camera and runs the detection in the background.
### Real-Time Object Detection and Intrusion Alert System
The Virtual Fencing System implements real-time object detection and intrusion alerting using YOLOv8, integrated seamlessly with Flask and Twilio’s WhatsApp API. The model ensures high-speed performance and precision in detecting human presence across multiple camera streams simultaneously.
### YOLOv8 Model Integration
The system employs the Ultralytics YOLOv8 Nano (yolov8n.pt) model for object detection due to its balance between accuracy and computational efficiency, making it ideal for real-time performance on CPU or GPU.
The Ultralytics library simplifies the deployment of YOLOv8, allowing direct model loading and inference through a minimal API interface.
#### Code Snippet: YOLO Inference and Detection Filtering
This modularized detection logic extracts bounding boxes, confidence scores, and class identifiers, enabling precise identification of persons within the video feed.

### Fence Drawing and Reset Mechanism
A virtual fence is defined by user-drawn lines that demarcate restricted zones.
The system integrates an OpenCV-based GUI interaction allowing users to draw, reset, and save fence coordinates dynamically. These coordinates are persisted in JSON format, enabling reuse across sessions.

#### Code Snippet: Fence Drawing

This mechanism provides a simple yet effective user interface to configure virtual boundaries, ensuring adaptability for different surveillance zones.
### Intrusion Detection Logic
Once fence coordinates are established, every incoming frame is analyzed to determine if any detected object crosses the virtual boundary. The system uses OpenCV’s geometric functions to test whether the centroid of a detected object lies within the fenced area. Upon detection, an intrusion event is generated and queued for alert processing.

#### Code Snippet: Intrusion Detection Process



### Detection Manager and Multi-Camera Processing
The detection logic is encapsulated within the DetectionManager class (in detection_utils.py), responsible for handling object detection, tracking, snapshot saving, and alert triggering.
Each camera stream is independently managed, enabling multi-camera surveillance through multiprocessing.

#### Key Features:
- YOLOv8 tracking via model.track() for robust identity management.
- State management (object_paths, alerted_objects) per camera to prevent duplicate alerts.
- Centralized frame caching for consistent monitoring.
- Efficient snapshot storage for post-event analysis.

Core Code Logic:


This ensures that only true cross-boundary events are logged, reducing false positives.


### Snapshot Logging and WhatsApp Notification System
Upon confirmed intrusion detection, a snapshot is captured and saved under /static/intrusion_snaps/.
An entry is logged into the SQLite database (fences.db), maintaining metadata such as camera ID, timestamp, and image path.
Simultaneously, the system triggers an instant WhatsApp alert using Twilio API and ngrok public URL for image access.
#### Code Snippet: WhatsApp Alert Sending

This integration provides real-time remote monitoring and alert communication to authorized users, enhancing responsiveness to security events.

### Database Logging
Each intrusion is logged into the FenceCrossEvent model with the following fields:
| Field Name | Description |
| --- | --- |
| id | Unique event identifier |
| cam_id | The camera associated with the event |
| image_path | Relative path to the captured snapshot |
| timestamp | UTC timestamp of the intrusion |


This ensures a structured record for analysis and system auditing.


Logs and Snapshots Saving Logic
The logging logic is integrated directly into the Detection_utils.py
Code Snippet: Logging and Snapshot Saving

CHAPTER 5
TESTING AND RESULTS
5.1 System Testing
The testing phase was carried out systematically to ensure the Virtual Fencing system’s accuracy, robustness, and reliability. Both unit testing and integration testing were performed to verify the functionality of each individual module and the performance of the system as a whole.
5.1.1 Unit Testing
Each functional component of the Flask-based application was tested in isolation to verify its correctness and stability.
- YOLOv8 Detection Validation:
The YOLOv8 Nano (yolov8n.pt) model was tested with multiple live camera frames to ensure correct identification and tracking of the “person” class. Confidence thresholds and bounding box accuracy were analyzed for consistency.
- Centroid and Fence Intersection Calculation:
The centroid of each detected bounding box was computed and validated.
The shapely library’s LineString intersection was tested to ensure that object movement crossing the defined fence line triggered an alert correctly.
- Twilio WhatsApp Alert Functionality :
Using the Twilio REST client, the WhatsApp alert mechanism was tested to ensure reliable message delivery, including text-based and image-based alerts. Each alert was verified to include the camera ID, timestamp, and intrusion image URL.
- Snapshot Logging and Database Storage:
The SQLite database (fences.db) was tested to confirm that every detected intrusion event was logged with the correct timestamp, image path, and camera ID.The FenceCrossEvent model and SQLAlchemy session commits were tested for accuracy and integrity.



5.1.2 Integration Testing
Comprehensive integration testing was performed to ensure that the individual modules—YOLOv8 detection, fence drawing, Flask routing, Twilio messaging, and database operations—worked cohesively in real-time.
- Fence Drawing and Persistence Test:
The user interaction with the “Draw Fence” feature was tested using OpenCV. Fence coordinates were successfully captured through left-click events and stored in Database file (fences/camera_<id>).
- Intrusion Detection to WhatsApp Alert Flow:
The complete end-to-end process—from live detection to WhatsApp alert—was verified. When a person entered the restricted fence zone, the system:
- Detected the movement using YOLOv8 tracking.
- Captured the frame and saved it as an intrusion snapshot.
- Logged the event in the database.
- Sent a WhatsApp alert (with image) using Twilio API through Ngrok’s public endpoint.
- Multi-Camera Concurrency Test:
The system was tested with multiple concurrent camera feeds to ensure process isolation and shared resource safety. Each camera maintained an independent tracking state, frame cache, and alert set without interference.
- Error Handling and Recovery:
Scenarios such as camera disconnection, invalid frame inputs, or delayed responses from Twilio were simulated. The system gracefully handled these situations with informative log messages and automatic state resets
5.1.3 Performance Testing
Performance testing focused on real-time responsiveness, detection accuracy, and alert latency.
- Frame Processing Rate:
The average FPS (Frames per Second) was monitored for live camera streams. The YOLOv8 Nano model sustained a stable frame rate of 15 FPS on a standard CPU.

- Alert Latency Measurement:
Using Python’s time module, the duration between intrusion detection and WhatsApp alert delivery was measured. Average latency observed was 5 seconds, including image upload and Twilio API response time.
- System Resource Utilization:
CPU and memory usage were profiled using OS-level monitoring tools. Resource consumption remained under 60% CPU usage on a quad-core processor, validating suitability for edge deployment.
- Robustness Under Continuous Operation:
The system was operated continuously for 4 hours with active live streams to evaluate stability. No crashes or significant memory leaks were observed.
5.2 Output Screenshots
The following figures represent the operational outcomes of the Virtual Fencing Intrusion Detection System:
Fig 5.1: Multi-Camera Dashboard displaying live feeds and status indicators.




Fig 5.2: Fence Drawing Interface using OpenCV window for virtual boundary definition.







Fig 5.3: Intrusion Detection Snapshot showing bounding box and centroid overlay on the detected person.



Fig 5.4: WhatsApp Alert message sent via Twilio API, including timestamp, camera ID, and intrusion snapshot.
Fig 5.5: Log and Snap Viewer Page in Flask web interface displaying historical intrusion records.


Table 5.2: Performance Evaluation (FPS, CPU, Latency)
| No of Cameras | Avg. Detection FPS (per cam) | Total CPU Usage | Alert Latency (avg. sec) |
| --- | --- | --- | --- |
| 1 | 15 FPS | 25% | 3.9 s |
| 2 | 12 FPS | 48% | 4.4 s |
| 3 | 8 FPS | 70% | 5.1 s |
| 4 | 6 FPS | 90% | 5.7 s |


5.3 Performance Evaluation
The Virtual Fencing Intrusion Detection System was tested extensively on a CPU-based environment (Intel Core i7 processor, 16 GB RAM) using the YOLOv8n (Nano) model integrated through the Ultralytics library.
The multiprocessing design successfully handled multiple simultaneous camera feeds, demonstrating excellent scalability and efficient resource utilization.
The system maintained an average of 15 FPS per camera for a single stream and sustained a stable 6 FPS per camera across four concurrent feeds. Total CPU utilization reached approximately 89%, indicating optimal use of available cores without performance bottlenecks.
The alert generation process—including detection, snapshot saving, database logging, and Twilio WhatsApp message delivery—exhibited an average end-to-end latency of 5.7 seconds, remaining well below the 10-second real-time threshold for actionable alerts.This performance validates the queue-based communication and process-isolated detection pipeline, which effectively bypassed Python’s Global Interpreter Lock (GIL) constraints while maintaining consistent frame throughput.



5.4 Discussion on Results
The evaluation results confirmed the robustness and efficiency of the proposed architecture for real-time intrusion detection on CPU-based systems:
- Real-Time Feasibility: The YOLOv8n model achieved high detection accuracy while maintaining sufficient FPS for real-time surveillance, proving the viability of lightweight models in CPU-only environments.
- Scalability and Stability: The multiprocessing implementation ensured that each camera operated in an independent process, avoiding data contention and enabling stable scaling up to four cameras.
- Fence Detection Accuracy: The fence-drawing module using OpenCV performed accurately in defining virtual boundaries. However, it required direct desktop interaction, limiting usability in remote environments—a potential area for future web-based enhancement.
- Instant Alerting Mechanism: The Twilio–WhatsApp integration, in combination with Ngrok tunneling, enabled near-instant remote notifications with live image attachments. This drastically improved situational awareness and response time for potential intrusions.
- Resource Efficiency: Despite the computational demands of deep learning inference, the system maintained manageable CPU utilization and memory overhead, making it suitable for edge deployment or small surveillance setups.
Overall, the system achieved its intended objectives — real-time intrusion detection, reliable alert delivery, and efficient multi-camera management — proving the effectiveness of combining Flask, YOLOv8, OpenCV, and Twilio into a cohesive AI-driven security solution







CHAPTER 6:
CONCLUSION
## 6.1 Conclusion
The primary objective of this project — to design and implement an AI-Based Virtual Fencing System capable of intelligent, real-time, multi-camera surveillance — has been successfully achieved.
The developed system represents a robust, end-to-end AI surveillance solution that efficiently replaces traditional physical barriers with a software-defined, smart monitoring architecture.
This project integrated computer vision, multiprocessing, and communication systems to achieve a seamless and responsive intrusion detection pipeline. The main achievements include:
- Concurrency and Parallel Processing: Through Python’s multiprocessing module and a modular Flask-based design, the system effectively handled four concurrent camera streams with near-real-time performance. The architecture overcame the Global Interpreter Lock (GIL) bottleneck and distributed the workload across CPU cores, achieving a stable 15 FPS aggregate performance without GPU dependency.
- Accurate AI Detection: The YOLOv8n model, trained for lightweight real-time inference, efficiently detected human and object movement with high precision. The incorporation of centroid-based region checks using cv2.pointPolygonTest() ensured that intrusion events were localized precisely within user-defined fence boundaries, reducing false alarms.
- Instantaneous Communication via WhatsApp Alerts: Using Twilio’s WhatsApp API and Ngrok tunneling, the system delivered real-time multimedia alerts (with image snapshots and timestamps) directly to authorized users. This transformed passive surveillance into active, event-driven monitoring, ensuring rapid situational awareness.
- Cost-Effective and Scalable Design: The solution demonstrated that AI-driven surveillance can function effectively on standard CPUs without specialized hardware, thus reducing deployment costs and making it practical for industries, institutions, and smart home applications.

Overall, the project met or exceeded its performance goals — maintaining ≥4 FPS per camera, under 6 seconds average alert latency, and high detection accuracy — thereby validating its real-world feasibility.
This work demonstrates the viability of AI-based virtual fencing as a dynamic, adaptive, and scalable alternative to traditional surveillance systems.
## 6.2 Future Enhancements
Although the current system demonstrates excellent real-time performance, several areas offer potential for future improvement and scalability:
- Edge Device Optimization:
Deploy the system on IoT edge devices like NVIDIA Jetson Nano, Raspberry Pi, or Google Coral TPU to reduce backend computation load, improve inference speed, and enable low-power, decentralized operation.
- Cloud-Based Storage and Analytics:
Replace local alert logging with cloud-hosted databases (e.g., MongoDB Atlas, Firebase Firestore, or PostgreSQL) for metadata storage, and AWS S3/Google Cloud Storage for image archiving. This would allow centralized data access, analytics dashboards, and Ngrok-free global alert delivery.
- Advanced Object Tracking and Behavioral Analysis:
Integrate DeepSORT or ByteTrack for real-time object tracking with unique IDs. This enhancement will enable smart alert throttling, loitering detection, and directional movement analysis, improving contextual decision-making.
- Enhanced User Interface and Mobility:
Replace the OpenCV desktop GUI with a web-based interactive fence-drawing module (using HTML Canvas and JavaScript). Integrate mobile app support with Firebase push notifications for remote configuration, monitoring, and alert acknowledgment.
- Smart City and Enterprise Integration:
Expand the system’s scope for traffic management, industrial safety, and public-space monitoring. With proper scalability and cloud orchestration, this architecture could evolve into a centralized smart surveillance network.
CHAPTER 7
REFERENCES
[1] Redmon, J., Divvala, S., Girshick, R., & Farhadi, A. (2016). You only look once: Unified, real-time object detection. Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 779–788.
[2] Jocher, G., et al. (2023). Ultralytics YOLOv8: Real-time, state-of-the-art object detection and segmentation. Available from: https://github.com/ultralytics/ultralytics
[3] Zheng, Z., Wang, P., Liu, Y., Li, S., & Sun, C. (2020). Distance-IoU Loss: Faster and better learning for bounding box regression. Proceedings of the AAAI Conference on Artificial Intelligence, 34(07), 6536–6543.
[4] Twilio, Inc. (2024). Twilio API for WhatsApp Documentation. Available from: https://www.twilio.com/docs/whatsapp
[5] OpenCV. (2024). OpenCV Documentation (cv2.setMouseCallback and cv2.pointPolygonTest). Available from: https://docs.opencv.org/
[6] Python Software Foundation. (2024). Python Multiprocessing Documentation. Available from: https://docs.python.org/3/library/multiprocessing.html
[7] Flask Development Team. (2024). Flask Documentation. Available from: https://flask.palletsprojects.com/en/
[8] Ngrok, Inc. (2024). Ngrok Documentation. Available from: https://ngrok.com/docs
[9] COCO Consortium. (2024). COCO Dataset: Common Objects in Context. Available from: https://cocodataset.org/
[10] Bradski, G., & Kaehler, A. (2008). Learning OpenCV: Computer vision with the OpenCV library. O'Reilly Media, Inc.
[11] Chollet, F. (2017). Deep Learning with Python. Manning Publications.
[12] Paszke, A., et al. (2019). PyTorch: An imperative style, high-performance deep learning library. Advances in Neural Information Processing Systems (NeurIPS), 32.
[13] Ronneberger, O., Fischer, P., & Brox, T. (2015). U-Net: Convolutional networks for biomedical image segmentation. MICCAI, Springer, 234–241.
[14] CVZone. (2023). OpenCV Python Tools for Real-Time Detection. Available from: https://github.com/cvzone/cvzone
[15] Shapely Developers. (2024). Shapely: Geometric Objects, Predicates, and Operations. Available from: https://shapely.readthedocs.io/
[16] Real Python. (2024). Using Python Multiprocessing for Parallel Computing. Available from: https://realpython.com/python-multiprocessing/
[17] Ultralytics. (2024). YOLOv8 Python API Documentation. Available from: https://docs.ultralytics.com/
[18] Stack Overflow. (2023). Discussion on MJPEG Streaming in Flask and FastAPI. Available from: https://stackoverflow.com/
[19] GeeksforGeeks. (2023). Sending WhatsApp Messages using Twilio API in Python. Available from: https://www.geeksforgeeks.org/send-whatsapp-messages-using-twilio-api-in-python/
[20] Nair, V., & Hinton, G. E. (2010). Rectified Linear Units Improve Restricted Boltzmann Machines. Proceedings of the 27th International Conference on Machine Learning (ICML), 807–814.
