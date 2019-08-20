import React, { Component } from "react";
import axios from "axios";
import Select from "react-select";
import Dnd from "../dragNdrop/Dnd";
import { Form, FormGroup, Label, Col, Row, Button } from 'reactstrap';
import '../App.css';
import { toastSuccess, toastError } from "../NotificationToast";

const baseUrl = process.env.REACT_APP_API_URL;
export default class SetSign extends Component {
  constructor(props) {
    super(props);
    this.state = {
      aboutPage: {
        pageId: null,
        pageTop: null,
        pageLeft: null,
        pageHeight: null,
        pageWidth: null
      },
      sender: "nikhil.patel@bacancytechnology.com",
      seletedRecipient: null,
      seletedRecipientsList: [],
      recipientList: [],
      selecteOptions: [],
      imagePreviewUrl: '',
      divPos: [],
      isDataStored: false,
      signPos: [],
      docId: 4,
      creatorId: 2,
      clientImageHeight: null,
      clientImageWidth: null,
      doc_signs_data: [],
    };
  }

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateDimensions);
  }

  updateDimensions = () => {
    let { aboutPage } = { ...this.state }
    aboutPage.pageHeight = document.getElementById('pg-1').clientHeight;
    aboutPage.pageWidth = document.getElementById('pg-1').clientWidth;
    this.setState({ aboutPage })
  }

  componentDidMount = () => {
    window.addEventListener("resize", this.updateDimensions);
    axios.get(`${baseUrl}/getRecipientList/`)
      .then((response) => {
        let { selecteOptions, recipientList } = this.state;
        recipientList = response.data.data
        selecteOptions = response.data.data.map(({ id, name, email }) => {
          let value = id;
          let label = name;
          let docSignId = null;
          return { value, label, docSignId, email };
        });
        this.setState({ recipientList, selecteOptions })
      })
      .catch((error) => {
        console.log(error);
      });
    this.onLoadPdf();
  }

  onLoadPdf = () => {
    axios.get(`${baseUrl}/getDoc/${this.state.docId}`)
      .then((response) => {
        if (response.data.data) {
          this.setState({ imagePreviewUrl: response.data.data })
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  formdataCoverter(payload) {
    let formdata = new FormData();
    for (let k in payload)
      formdata.append(k, payload[k]);
    return formdata;
  }

  handleChange = (selectedOption) => {
    let { seletedRecipient, doc_signs_data, seletedRecipientsList } = { ...this.state };
    seletedRecipient = selectedOption;
    let isFound = false;
    if (seletedRecipient) {
      if (doc_signs_data.length) {
        doc_signs_data.forEach(obj => { if (obj.recipientId === selectedOption.value) isFound = true })
        if (!isFound) {
          let statusId = 1, statusDate = Date.now();
          let documentId = this.state.docId, creatorId = this.state.creatorId, recipientId = selectedOption.value;
          doc_signs_data.push({ statusDate, statusId, creatorId, recipientId, documentId })
          seletedRecipientsList.push(selectedOption)
        }
      } else {
        let statusId = 1, statusDate = Date.now();
        let documentId = this.state.docId, creatorId = this.state.creatorId, recipientId = selectedOption.value;
        doc_signs_data.push({ statusDate, statusId, creatorId, recipientId, documentId })
        seletedRecipientsList.push(selectedOption)
      }
    }
    this.setState({ seletedRecipient, doc_signs_data, seletedRecipientsList });
  };

  onsetDocSign = () => {
    axios.post(`${baseUrl}/docsing/`, this.state.doc_signs_data)
      .then((response) => {
        let { doc_signs_data, selecteOptions, seletedRecipient } = { ...this.state };
        doc_signs_data = response.data.data
        seletedRecipient = null
        selecteOptions = response.data.data.map((obj) => {
          let value = obj.recipient.id;
          let label = obj.recipient.name;
          let docSignId = obj.id;
          let email = obj.recipient.email;
          return { value, label, docSignId, email };
        });
        this.setState({ seletedRecipient, selecteOptions, doc_signs_data, isDataStored: true })
        toastSuccess(response.data.message)
      })
      .catch((error) => {
        toastError(error.message)
      });
  }


  onDragOverCaptureImage = (event) => {
    let { aboutPage } = { ...this.state }
    aboutPage.pageId = event.target.id;
    aboutPage.pageTop = event.target.offsetTop;
    aboutPage.pageLeft = event.target.offsetLeft;
    aboutPage.pageHeight = event.target.height;
    aboutPage.pageWidth = event.target.width;
    this.setState({ aboutPage })
  }

  onPageLoad = (event) => {
    let { aboutPage } = { ...this.state }
    aboutPage.pageId = event.target.id;
    aboutPage.pageTop = event.target.offsetTop;
    aboutPage.pageLeft = event.target.offsetLeft;
    aboutPage.pageHeight = event.target.height;
    aboutPage.pageWidth = event.target.width;
    this.setState({ aboutPage })
  }

  setImages = () => {
    return this.state.imagePreviewUrl.map((img, index) => <div key={index + 1} className='d-flex mt-3 bg-secondary'><img width={"100%"} className={"pdfpage"} id={'pg-' + (index + 1)} onLoadCapture={this.onPageLoad} onDragEnter={this.onDragOverCaptureImage} src={'http://192.168.1.49:8000/upload/' + img} alt={index + 1} /></div>);
  }

  render() {
    const { seletedRecipient, selecteOptions, imagePreviewUrl, isDataStored } = this.state;
    return (
      <>
        <Form className='m-5' id='setsignForm'>
          <Row form>
            <Col md={6}>
              <FormGroup>
                <Label>Select Recipient: </Label>
                <Select
                  isSearchable
                  value={seletedRecipient}
                  onChange={this.handleChange}
                  options={selecteOptions}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <Label>Selected Recipients : </Label>
              <FormGroup>
                {this.state.seletedRecipientsList.map((obj) => <Label id="divpos" key={obj.value} className={"pr-2 text-uppercase text-info"} size="md">{obj.label}</Label>)}
              </FormGroup>
            </Col>
            <Col md={3}>
              {!isDataStored &&
                <>
                  <FormGroup>
                    <Button onClick={this.onsetDocSign} color="primary"> Add Doc Sign Details </Button>
                  </FormGroup>
                </>
              }
            </Col>
          </Row>
          <Row form>
            {/* <Col md={6}>
              <Label>Selected Recipients : </Label>
              <FormGroup>
                {this.state.seletedRecipientsList.map((obj) => <Label id="divpos" key={obj.value} className={"pr-2 text-uppercase text-info"} size="md">{obj.label}</Label>)}
              </FormGroup>
            </Col> */}
          </Row>
          {/* <Button onClick={this.onSendFile} >Send File</Button> */}
          <Row form>
            <Col md={12}>
              <center><Label size="lg" className='align'> File Viewer</Label></center>
            </Col>
          </Row>
          <Row form>
            {
              imagePreviewUrl.length &&
              <Dnd sender={this.state.sender} pageDetails={this.state.aboutPage} totalRecipients={this.state.selecteOptions} doc_signs_data={this.state.doc_signs_data} seletedRecipient={this.state.seletedRecipient} setImages={this.setImages()} />
            }
          </Row>
        </Form>
      </>
    );
  }
}

// onSendFile = () => {
//   const payload = {
//     pageNo: this.state.pageNumber - 1,
//     totalPages: this.state.numPages,
//     signX: this.state.signPos[0],
//     signY: this.state.signPos[1],
//     divX: this.state.divPos[0],
//     divY: this.state.divPos[1],
//     pdf: this.state.file,
//     sign: this.state.file2,
//   }
//   axios.post('http://192.168.1.49:8000/pdftohtml/', this.formdataCoverter(payload))
//     .then(function (response) {
//       console.log(response);
//     })
//     .catch(function (error) {
//       console.log(error);
//     });
// }

